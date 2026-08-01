import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { EMBED_COLOR } from '../constants/index.js';
import { formatDuration } from '../utils/format.js';
import { sendReply } from '../utils/reply.js';

const PAGE_SIZE = 10;

export const queueCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current queue.')
    .addIntegerOption((option) =>
      option.setName('page').setDescription('Page number to show (1-based)').setMinValue(1),
    ),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    const current = player.current;
    const tracks = player.queue.toArray();
    const page = interaction.options.getInteger('page') ?? 1;
    const totalPages = Math.max(1, Math.ceil(tracks.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const slice = tracks.slice(start, start + PAGE_SIZE);

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle(`Queue — ${interaction.guild?.name ?? 'this server'}`)
      .setDescription(
        current
          ? `**Now playing:** ${current.title} \`[${current.isStream ? 'LIVE' : formatDuration(current.length)}]\``
          : 'Nothing is playing.',
      );

    if (slice.length === 0) {
      embed.addFields({ name: 'Up next', value: 'The queue is empty.' });
    } else {
      const lines = slice.map(
        (track, index) =>
          `${start + index + 1}. ${track.title} \`[${track.isStream ? 'LIVE' : formatDuration(track.length)}]\` <@${track.requestedBy}>`,
      );
      embed.addFields({ name: 'Up next', value: lines.join('\n') });
    }

    embed.setFooter({ text: `Page ${safePage}/${totalPages} • ${tracks.length} track(s)` });

    await sendReply(interaction, { embeds: [embed] });
  },
};
