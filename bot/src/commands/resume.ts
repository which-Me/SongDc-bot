import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlaying } from '../middleware/guards.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const resumeCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the current track.'),

  async execute(interaction, { manager }) {
    const player = await requirePlaying(interaction, manager);
    if (!player) return;

    if (!player.paused) {
      await sendReply(interaction, { embeds: [successEmbed('Playback is already playing.')] }, true);
      return;
    }

    player.setPaused(false);
    await sendReply(interaction, { embeds: [successEmbed('Resumed playback.')] });
  },
};
