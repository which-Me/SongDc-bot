import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const clearCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear the queue (keeps the current track playing).'),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    player.queue.clear();
    await sendReply(interaction, { embeds: [successEmbed('Cleared the queue.')] });
  },
};
