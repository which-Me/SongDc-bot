import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { EMBED_COLOR } from '../constants/index.js';
import { formatDuration } from '../utils/format.js';
import { sendReply } from '../utils/reply.js';

const MAX_ENTRIES = 10;

export const historyCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Show recently played tracks.'),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    const history = player.queue.getHistory().slice(-MAX_ENTRIES).reverse();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Playback History')
      .setDescription(
        history.length > 0
          ? history
              .map(
                (track, index) =>
                  `${index + 1}. ${track.title} \`[${track.isStream ? 'LIVE' : formatDuration(track.length)}]\``,
              )
              .join('\n')
          : 'Nothing has been played yet.',
      );

    await sendReply(interaction, { embeds: [embed] });
  },
};
