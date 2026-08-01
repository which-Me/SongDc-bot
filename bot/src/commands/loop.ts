import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { requirePlayer } from '../middleware/guards.js';
import { LoopMode } from '../types/music.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const loopCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Loop the current track, the whole queue, or turn looping off.')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Loop mode')
        .addChoices(
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' },
          { name: 'Off', value: 'none' },
        ),
    ),

  async execute(interaction, { manager }) {
    const player = await requirePlayer(interaction, manager);
    if (!player) return;

    const mode = (interaction.options.getString('mode') ?? 'none') as LoopMode;
    player.loop = mode;

    const label = mode === 'track' ? 'Track' : mode === 'queue' ? 'Queue' : 'Off';
    await sendReply(interaction, { embeds: [successEmbed(`Loop mode set to **${label}**.`)] });
  },
};
