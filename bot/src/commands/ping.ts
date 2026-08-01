import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { EMBED_COLOR } from '../constants/index.js';
import { sendReply } from '../utils/reply.js';

export const pingCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\u2019s gateway latency.'),

  async execute(interaction, { client }) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setDescription(`Gateway latency: **${client.ws.ping}ms**`);

    await sendReply(interaction, { embeds: [embed] });
  },
};
