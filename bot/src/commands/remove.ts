import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { errorEmbed } from '../utils/embeds.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const removeCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the queue by its position.')
    .addIntegerOption((option) =>
      option.setName('position').setDescription('Position of the track to remove (1-based)').setRequired(true).setMinValue(1),
    ),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    const position = interaction.options.getInteger('position', true) - 1;
    const removed = player.queue.remove(position);

    if (!removed) {
      await sendReply(
        interaction,
        { embeds: [errorEmbed('Invalid position', `The queue has ${player.queue.size} track(s).`)] },
        true,
      );
      return;
    }

    await sendReply(interaction, {
      embeds: [successEmbed(`Removed **${removed.title}** from the queue.`)],
    });
  },
};
