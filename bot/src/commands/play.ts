import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { getMemberVoiceChannel, requireVoice } from '../middleware/guards.js';
import { errorEmbed } from '../utils/embeds.js';
import { sendReply, successEmbed } from '../utils/reply.js';
import { isUrl } from '../utils/url.js';

export const playCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song, playlist, or search query.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Song name, YouTube/Spotify URL, or playlist link')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName('source')
        .setDescription('Where to search or resolve the query')
        .addChoices(
          { name: 'Auto', value: 'auto' },
          { name: 'YouTube', value: 'youtube' },
          { name: 'Spotify', value: 'spotify' },
          { name: 'SoundCloud', value: 'soundcloud' },
          { name: 'Local file', value: 'local' },
        ),
    ),

  async execute(interaction, { manager, config }) {
    if (!(await requireVoice(interaction))) return;

    const query = interaction.options.getString('query', true);
    const source = interaction.options.getString('source') ?? 'auto';
    const channel = getMemberVoiceChannel(interaction);
    if (!channel) return;

    await interaction.deferReply();

    let lavalinkQuery = query;
    if (source === 'local') {
      lavalinkQuery = `local:/data/music/${query.replace(/^\.?\//, '')}`;
    } else if (source === 'youtube' && !isUrl(query)) {
      lavalinkQuery = `ytsearch:${query}`;
    } else if (source === 'soundcloud' && !isUrl(query)) {
      lavalinkQuery = `scsearch:${query}`;
    } else if (source === 'spotify' && !isUrl(query)) {
      lavalinkQuery = `spsearch:${query}`;
    }

    try {
      const [player, result] = await Promise.all([
        manager.connect(interaction, channel.id),
        manager.search(lavalinkQuery, interaction.user.id, config.MAX_PLAYLIST_TRACKS),
      ]);

      if (result.type === 'track' || result.type === 'search') {
        const track = result.type === 'track' ? result.track : result.tracks[0];
        if (!track) throw new Error('No tracks found.');
        if (player.playing || !player.queue.isEmpty) {
          player.queue.add(track);
          await sendReply(interaction, {
            embeds: [successEmbed(`Added **${track.title}** to the queue.`)],
          });
        } else {
          await sendReply(interaction, {
            embeds: [successEmbed(`Playing **${track.title}**.`)],
          });
          await player.play(track);
        }
        return;
      }

      const tracks = result.tracks;

      if (player.playing || !player.queue.isEmpty) {
        const added = player.queue.addMany(tracks);
        await sendReply(interaction, {
          embeds: [successEmbed(`Added **${added}** track(s) from **${result.name}** to the queue.`)],
        });
        return;
      }

      const [first, ...rest] = tracks;
      player.queue.addMany(rest);
      await sendReply(interaction, {
        embeds: [successEmbed(`Playing playlist **${result.name}** (${tracks.length} tracks).`)],
      });
      if (first) await player.play(first);
    } catch (error) {
      await sendReply(interaction, { embeds: [errorEmbed('Play Error', (error as Error).message)] });
    }
  },
};
