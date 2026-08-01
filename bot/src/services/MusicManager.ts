import {
  ActivityType,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Client,
  type Message,
  type PartialGroupDMChannel,
  type TextBasedChannel,
} from 'discord.js';
import { Constants, LoadType, type LavalinkResponse, type Node, type Shoukaku, type Track } from 'shoukaku';
import type { AppConfig } from '../config/env.js';
import { logger } from '../config/logger.js';
import { MusicPlayer } from '../music/player/MusicPlayer.js';
import type { PlaySource, QueueTrack } from '../types/music.js';
import { EMBED_COLOR } from '../constants/index.js';
import { errorEmbed, progressEmbed } from '../utils/embeds.js';
import { formatDuration } from '../utils/format.js';
import { isUrl } from '../utils/url.js';

type SendableChannel = Exclude<TextBasedChannel, PartialGroupDMChannel>;

export interface HealthState {
  uptimeSeconds: number;
  lavalinkConnected: boolean;
  activePlayers: number;
  clientReady: boolean;
  wsPing: number;
}

export class MusicManager {
  private readonly players = new Map<string, MusicPlayer>();
  private readonly textChannels = new Map<string, SendableChannel>();
  private readonly nowPlayingMessages = new Map<string, Message>();
  // ponytail: dedup concurrent connects for the same guild; joinVoiceChannel is
  // slow (~1-3s) and two parallel /play calls would otherwise create 2 players.
  private readonly pendingConnects = new Map<string, Promise<MusicPlayer>>();
  // ponytail: tiny TTL cache so repeated /play and autoplay queries skip the Lavalink round-trip.
  private readonly resolveCache = new Map<string, { data: LavalinkResponse; expiresAt: number }>();
  private static readonly SEARCH_CACHE_TTL_MS = 5 * 60_000;
  private static readonly SEARCH_CACHE_MAX = 200;

  constructor(
    private readonly client: Client,
    private readonly shoukaku: Shoukaku,
    private readonly config: AppConfig,
  ) {}

  get(guildId: string): MusicPlayer | undefined {
    return this.players.get(guildId);
  }

  has(guildId: string): boolean {
    return this.players.has(guildId);
  }

  activeGuildIds(): string[] {
    return [...this.players.keys()];
  }

  async connect(interaction: ChatInputCommandInteraction, voiceChannelId: string): Promise<MusicPlayer> {
    const guild = interaction.guild;
    if (!guild) throw new Error('Guild not found.');

    const existing = this.players.get(guild.id);
    if (existing) {
      this.setChannel(guild.id, interaction.channel);
      return existing;
    }

    // Another /play may be mid-connect for this guild; share its promise
    // instead of racing a second joinVoiceChannel.
    const inFlight = this.pendingConnects.get(guild.id);
    if (inFlight) return inFlight;

    const pending = this.doConnect(interaction, voiceChannelId).finally(() => {
      this.pendingConnects.delete(guild.id);
    });
    this.pendingConnects.set(guild.id, pending);
    return pending;
  }

  private async doConnect(
    interaction: ChatInputCommandInteraction,
    voiceChannelId: string,
  ): Promise<MusicPlayer> {
    const guild = interaction.guild;
    if (!guild) throw new Error('Guild not found.');

    const shoukakuPlayer = await this.shoukaku.joinVoiceChannel({
      guildId: guild.id,
      channelId: voiceChannelId,
      shardId: guild.shardId ?? 0,
      deaf: true,
    });

    const player = new MusicPlayer({
      guildId: guild.id,
      player: shoukakuPlayer,
      voiceChannelId,
      defaultVolume: this.config.DEFAULT_VOLUME,
      autoLeaveMs: this.config.AUTO_LEAVE_EMPTY_MS,
      events: {
        onNowPlaying: (musicPlayer) => this.handleNowPlaying(musicPlayer),
        onQueueEnd: (musicPlayer) => this.handleQueueEnd(musicPlayer),
        onIdleTimeout: (musicPlayer) => this.disconnect(musicPlayer.guildId),
        onError: (musicPlayer, message) => this.handleError(musicPlayer, message),
      },
    });

    this.players.set(guild.id, player);
    this.setChannel(guild.id, interaction.channel);
    logger.info({ guild: guild.id }, 'Player created.');
    return player;
  }

  async disconnect(guildId: string): Promise<void> {
    const player = this.players.get(guildId);
    if (!player) {
      await this.shoukaku.leaveVoiceChannel(guildId);
      return;
    }
    this.players.delete(guildId);
    this.textChannels.delete(guildId);
    this.nowPlayingMessages.delete(guildId);
    player.destroy();
    await this.shoukaku.leaveVoiceChannel(guildId);
    this.updateActivity();
    logger.info({ guild: guildId }, 'Player destroyed.');
  }

  async search(query: string, requestedBy: string, limit: number): Promise<PlaySource> {
    const node = this.shoukaku.getIdealNode();
    if (!node) throw new Error('No Lavalink node is available. Try again in a moment.');

    const lavalinkQuery = isUrl(query) ? query : `ytsearch:${query}`;
    const result = await this.resolve(node, lavalinkQuery);
    if (!result) throw new Error('No tracks found for your query.');

    switch (result.loadType) {
      case LoadType.TRACK: {
        return { type: 'track', track: this.normalize(result.data, requestedBy) };
      }
      case LoadType.PLAYLIST: {
        const tracks = result.data.tracks.slice(0, limit).map((track) => this.normalize(track, requestedBy));
        if (tracks.length === 0) throw new Error('Playlist is empty.');
        return { type: 'playlist', name: result.data.info.name, tracks };
      }
      case LoadType.SEARCH: {
        const tracks = result.data.slice(0, limit).map((track) => this.normalize(track, requestedBy));
        if (tracks.length === 0) throw new Error('No tracks found.');
        return { type: 'search', tracks };
      }
      case LoadType.EMPTY:
        throw new Error('No tracks found for your query.');
      case LoadType.ERROR:
        throw new Error(result.data.message || 'Failed to load the track.');
    }
  }

  getHealthState(): HealthState {
    const node = [...this.shoukaku.nodes.values()][0];
    return {
      uptimeSeconds: Math.floor(process.uptime()),
      lavalinkConnected: node?.state === Constants.State.CONNECTED,
      activePlayers: this.players.size,
      clientReady: this.client.isReady(),
      wsPing: this.client.ws.ping,
    };
  }

  private setChannel(guildId: string, channel: ChatInputCommandInteraction['channel'] | null): void {
    if (channel && 'send' in channel) this.textChannels.set(guildId, channel as SendableChannel);
  }

  private async resolve(node: Node, identifier: string): Promise<LavalinkResponse | undefined> {
    const now = Date.now();
    const cached = this.resolveCache.get(identifier);
    if (cached && cached.expiresAt > now) return cached.data;

    const data = await node.rest.resolve(identifier);
    if (data) {
      this.resolveCache.set(identifier, { data, expiresAt: now + MusicManager.SEARCH_CACHE_TTL_MS });
      if (this.resolveCache.size > MusicManager.SEARCH_CACHE_MAX) {
        const oldest = this.resolveCache.keys().next().value;
        if (oldest) this.resolveCache.delete(oldest);
      }
    }
    return data;
  }

  private normalize(track: Track, requestedBy: string): QueueTrack {
    return {
      encoded: track.encoded,
      identifier: track.info.identifier,
      title: track.info.title,
      author: track.info.author,
      uri: track.info.uri ?? null,
      length: track.info.length,
      isStream: track.info.isStream,
      artworkUrl: track.info.artworkUrl ?? null,
      sourceName: track.info.sourceName,
      requestedBy,
    };
  }

  private async handleNowPlaying(player: MusicPlayer): Promise<void> {
    const track = player.current;
    const channel = this.textChannels.get(player.guildId);
    if (!track || !channel) return;

    const upNext = player.queue.size;
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Now Playing')
      .setDescription(`**${track.title}**`)
      .addFields(
        { name: 'Artist', value: track.author || 'Unknown', inline: true },
        { name: 'Duration', value: track.isStream ? 'LIVE' : formatDuration(track.length), inline: true },
        { name: 'Requested by', value: `<@${track.requestedBy}>`, inline: true },
        { name: 'Up next', value: upNext > 0 ? `${upNext} track(s)` : 'Nothing', inline: true },
        { name: 'Loop', value: `\`${player.loop}\``, inline: true },
        { name: 'Autoplay', value: player.autoplay ? 'Enabled' : 'Disabled', inline: true },
        { name: 'Progress', value: progressEmbed(track, player.position), inline: false },
      );

    if (track.artworkUrl) embed.setThumbnail(track.artworkUrl);
    if (track.uri) embed.setURL(track.uri);

    await this.sendNowPlaying(player.guildId, embed);
    this.updateActivity();
  }

  private async sendNowPlaying(guildId: string, embed: EmbedBuilder): Promise<void> {
    const channel = this.textChannels.get(guildId);
    if (!channel) return;

    const existing = this.nowPlayingMessages.get(guildId);
    if (existing && existing.editable) {
      try {
        await existing.edit({ embeds: [embed] });
        return;
      } catch {
        this.nowPlayingMessages.delete(guildId);
      }
    }

    try {
      const message = await channel.send({ embeds: [embed] });
      this.nowPlayingMessages.set(guildId, message);
    } catch (error) {
      logger.warn({ guild: guildId }, `Failed to send now-playing embed: ${error}`);
    }
  }

  private async handleQueueEnd(player: MusicPlayer): Promise<void> {
    this.updateActivity();
    if (player.autoplay && player.lastPlayed) {
      await this.autoplayNext(player);
    }
  }

  private async autoplayNext(player: MusicPlayer): Promise<void> {
    const last = player.lastPlayed;
    if (!last) return;
    try {
      const result = await this.search(`${last.author} ${last.title}`, 'autoplay', 5);
      const candidates =
        result.type === 'search' ? result.tracks : result.type === 'track' ? [result.track] : result.tracks;
      const candidate = candidates.find((track) => track.identifier !== last.identifier) ?? candidates[0];
      if (!candidate) return;
      player.queue.add(candidate);
      await player.playNext();
    } catch (error) {
      logger.warn({ guild: player.guildId }, `Autoplay failed: ${error}`);
    }
  }

  private async handleError(player: MusicPlayer, message: string): Promise<void> {
    logger.error({ guild: player.guildId }, message);
    const channel = this.textChannels.get(player.guildId);
    if (!channel) return;
    try {
      await channel.send({ embeds: [errorEmbed('Playback Error', message)] });
    } catch {
      // Channel may have disappeared; nothing to do.
    }
  }

  private updateActivity(): void {
    if (!this.client.user) return;
    const track = [...this.players.values()].find((p) => p.current)?.current;
    if (track) {
      void this.client.user.setActivity(`♪ ${track.title}`, { type: ActivityType.Listening });
    } else {
      void this.client.user.setPresence({ activities: [] });
    }
  }
}
