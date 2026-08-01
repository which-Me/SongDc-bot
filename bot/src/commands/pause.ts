import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlaying } from '../middleware/guards.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const pauseCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current track.'),

  async execute(interaction, { manager }) {
    const player = await requirePlaying(interaction, manager);
    if (!player) return;

    if (player.paused) {
      await sendReply(interaction, { embeds: [successEmbed('Playback is already paused.')] }, true);
      return;
    }

    player.setPaused(true);
    await sendReply(interaction, { embeds: [successEmbed('Paused playback.')] });
  },
};
