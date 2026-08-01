import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const disconnectCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnect the bot from the voice channel.'),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    await manager.disconnect(interaction.guildId ?? '');
    await sendReply(interaction, { embeds: [successEmbed('Disconnected from the voice channel.')] });
  },
};
