import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlaying } from '../middleware/guards.js';
import { EMBED_COLOR } from '../constants/index.js';
import { formatDuration } from '../utils/format.js';
import { progressBar } from '../utils/progress.js';
import { sendReply } from '../utils/reply.js';

export const nowPlayingCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show details about the current track.'),

  async execute(interaction, { manager }) {
    const player = await requirePlaying(interaction, manager);
    if (!player) return;
    const track = player.current;
    if (!track) return;

    const bar = progressBar(player.position, track.length);
    const progress = `\`${bar}\` \`${formatDuration(player.position)} / ${track.isStream ? 'LIVE' : formatDuration(track.length)}\``;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Now Playing')
      .setDescription(`**${track.title}**${track.uri ? `\n${track.uri}` : ''}`)
      .addFields(
        { name: 'Artist', value: track.author || 'Unknown', inline: true },
        { name: 'Requested by', value: `<@${track.requestedBy}>`, inline: true },
        { name: 'Volume', value: `\`${player.volume}%\``, inline: true },
        { name: 'Loop', value: `\`${player.loop}\``, inline: true },
        { name: 'Autoplay', value: player.autoplay ? 'Enabled' : 'Disabled', inline: true },
        { name: 'Progress', value: progress, inline: false },
      );

    if (track.artworkUrl) embed.setThumbnail(track.artworkUrl);

    await sendReply(interaction, { embeds: [embed] });
  },
};
