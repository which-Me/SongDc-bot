import type { Client } from 'discord.js';
import type { AppConfig } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { CommandCollection } from '../services/CommandService.js';
import { registerCommands } from '../services/CommandService.js';

export function registerReadyHandler(
  client: Client,
  config: AppConfig,
  commands: CommandCollection,
): void {
  client.once('ready', (clientUser) => {
    logger.info(`Logged in as ${clientUser.user.tag} (${clientUser.user.id}).`);
    void registerCommands(client, config, commands);
  });
}
