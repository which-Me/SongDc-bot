import {
  Collection,
  REST,
  Routes,
  type Client,
} from 'discord.js';
import type { AppConfig } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { BotCommand } from '../types/command.js';

export type CommandCollection = Collection<string, BotCommand>;

export async function registerCommands(
  client: Client,
  config: AppConfig,
  commands: CommandCollection,
): Promise<void> {
  const rest = new REST().setToken(config.DISCORD_TOKEN);
  const body = commands.map((command) => command.data.toJSON());

  try {
    if (config.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body });
      logger.info(`Registered ${body.length} guild command(s) for guild ${config.GUILD_ID}.`);
    } else {
      await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body });
      logger.info(`Registered ${body.length} global command(s).`);
    }
  } catch (error) {
    logger.error(`Failed to register commands: ${error}`);
    if (!client.isReady()) throw error;
  }
}
