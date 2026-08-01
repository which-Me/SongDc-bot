import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const stopCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback, clear the queue, and leave the voice channel.'),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    player.queue.clear();
    await manager.disconnect(interaction.guildId ?? '');
    await sendReply(interaction, { embeds: [successEmbed('Stopped playback and left the voice channel.')] });
  },
};
