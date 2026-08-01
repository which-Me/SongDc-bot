import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { MAX_VOLUME } from '../constants/index.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const volumeCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Show or set the playback volume.')
    .addIntegerOption((option) =>
      option
        .setName('level')
        .setDescription(`Volume level (0-${MAX_VOLUME})`)
        .setMinValue(0)
        .setMaxValue(MAX_VOLUME),
    ),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    const level = interaction.options.getInteger('level');
    if (level === null) {
      await sendReply(interaction, {
        embeds: [successEmbed(`Current volume is **${player.volume}%**.`)],
      });
      return;
    }

    player.setVolume(level);
    await sendReply(interaction, { embeds: [successEmbed(`Volume set to **${level}%**.`) ] });
  },
};

// Re-export for tests / tooling.
export { MAX_VOLUME };
