import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlaying } from '../middleware/guards.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const skipCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track.'),

  async execute(interaction, { manager }) {
    const player = await requirePlaying(interaction, manager);
    if (!player) return;

    const skipped = player.current;
    await player.stop();

    if (player.queue.isEmpty) {
      await sendReply(interaction, {
        embeds: [successEmbed(`Skipped **${skipped?.title}**. The queue is now empty.`)],
      });
    } else {
      await sendReply(interaction, {
        embeds: [successEmbed(`Skipped **${skipped?.title}**.`)],
      });
    }
  },
};
