import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const shuffleCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the queue.'),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    if (player.queue.size < 2) {
      await sendReply(interaction, { embeds: [successEmbed('Not enough tracks to shuffle.')] }, true);
      return;
    }

    player.queue.shuffle();
    await sendReply(interaction, {
      embeds: [successEmbed(`Shuffled **${player.queue.size}** track(s).`)],
    });
  },
};
