import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlaying } from '../middleware/guards.js';
import { errorEmbed } from '../utils/embeds.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const jumpCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('jump')
    .setDescription('Jump to and play a track at a given queue position.')
    .addIntegerOption((option) =>
      option.setName('position').setDescription('Queue position to play (1-based)').setRequired(true).setMinValue(1),
    ),

  async execute(interaction, { manager }) {
    const player = await requirePlaying(interaction, manager);
    if (!player) return;

    const position = interaction.options.getInteger('position', true) - 1;
    const target = player.queue.remove(position);

    if (!target) {
      await sendReply(
        interaction,
        { embeds: [errorEmbed('Invalid position', `The queue has ${player.queue.size} track(s).`)] },
        true,
      );
      return;
    }

    await player.playNow(target);
    await sendReply(interaction, {
      embeds: [successEmbed(`Jumping to **${target.title}**.`)],
    });
  },
};
