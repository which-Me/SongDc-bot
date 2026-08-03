import { SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { sendReply, successEmbed } from '../utils/reply.js';

export const restartCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Hard-restart the bot process (Docker restarts it automatically).'),

  async execute(interaction) {
    await sendReply(interaction, { embeds: [successEmbed('Restarting the bot...')] });
    // The container runs with restart: unless-stopped, so exiting the process
    // makes Docker bring it back up with a clean slate.
    setTimeout(() => process.exit(0), 500);
  },
};
