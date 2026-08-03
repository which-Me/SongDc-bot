import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlaying } from '../middleware/guards.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const previousCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Play the track that was playing before the current one.'),

  async execute(interaction, { manager }) {
    const player = await requirePlaying(interaction, manager);
    if (!player) return;

    const previous = player.queue.previous();
    if (!previous) {
      await sendReply(interaction, { embeds: [successEmbed('There is no previous track.')] }, true);
      return;
    }

    await player.playNow(previous);
    await sendReply(interaction, {
      embeds: [successEmbed(`Playing previous track **${previous.title}**.`)],
    });
  },
};
