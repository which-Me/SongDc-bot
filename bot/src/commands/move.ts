import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { errorEmbed } from '../utils/embeds.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const moveCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Move a track to a different position in the queue.')
    .addIntegerOption((option) =>
      option.setName('from').setDescription('Current position (1-based)').setRequired(true).setMinValue(1),
    )
    .addIntegerOption((option) =>
      option.setName('to').setDescription('Target position (1-based)').setRequired(true).setMinValue(1),
    ),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    const from = interaction.options.getInteger('from', true) - 1;
    const to = interaction.options.getInteger('to', true) - 1;
    const track = player.queue.toArray()[from];

    if (!track || !player.queue.move(from, to)) {
      await sendReply(
        interaction,
        { embeds: [errorEmbed('Invalid positions', `The queue has ${player.queue.size} track(s).`)] },
        true,
      );
      return;
    }

    await sendReply(interaction, {
      embeds: [successEmbed(`Moved **${track.title}** to position **${to + 1}**.`)],
    });
  },
};
