import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlaying } from '../middleware/guards.js';
import { errorEmbed } from '../utils/embeds.js';
import { formatDuration } from '../utils/format.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const seekCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a position in the current track.')
    .addIntegerOption((option) =>
      option.setName('seconds').setDescription('Target position in seconds').setRequired(true).setMinValue(0),
    ),

  async execute(interaction, { manager }) {
    const player = await requirePlaying(interaction, manager);
    if (!player) return;
    const track = player.current;
    if (!track) return;

    const seconds = interaction.options.getInteger('seconds', true);
    const targetMs = seconds * 1000;

    if (!track.isStream && targetMs > track.length) {
      await sendReply(
        interaction,
        {
          embeds: [
            errorEmbed(
              'Invalid seek',
              `The track is only ${formatDuration(track.length)} long.`,
            ),
          ],
        },
        true,
      );
      return;
    }

    await player.seek(targetMs);
    await sendReply(interaction, {
      embeds: [successEmbed(`Seeked to **${formatDuration(targetMs)}**.`)],
    });
  },
};
