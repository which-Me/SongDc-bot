import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { BOT_NAME, BOT_VERSION, EMBED_COLOR } from '../constants/index.js';
import { formatDuration } from '../utils/format.js';
import { sendReply } from '../utils/reply.js';

export const statsCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show bot statistics.'),

  async execute(interaction, { client, manager }) {
    const health = manager.getHealthState();
    const memory = process.memoryUsage();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle(`${BOT_NAME} — Stats`)
      .addFields(
        { name: 'Version', value: BOT_VERSION, inline: true },
        { name: 'Uptime', value: formatDuration(process.uptime() * 1000), inline: true },
        { name: 'Guilds', value: String(client.guilds.cache.size), inline: true },
        { name: 'Active players', value: String(health.activePlayers), inline: true },
        { name: 'Gateway latency', value: `${health.wsPing}ms`, inline: true },
        {
          name: 'Lavalink',
          value: health.lavalinkConnected ? 'Connected' : 'Disconnected',
          inline: true,
        },
        { name: 'Memory (RSS)', value: `${Math.round(memory.rss / 1024 / 1024)} MB`, inline: true },
      );

    await sendReply(interaction, { embeds: [embed] });
  },
};
