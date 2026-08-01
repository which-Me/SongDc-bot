import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const autoplayCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle autoplay (plays similar tracks when the queue ends).'),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    player.autoplay = !player.autoplay;
    await sendReply(interaction, {
      embeds: [successEmbed(`Autoplay ${player.autoplay ? '**enabled**' : '**disabled**'}.`)],
    });
  },
};
