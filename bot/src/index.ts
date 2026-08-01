import { Client, GatewayIntentBits } from 'discord.js';
import { loadConfig } from './config/env.js';
import { logger } from './config/logger.js';
import { createShoukaku } from './services/LavalinkService.js';
import { MusicManager } from './services/MusicManager.js';
import { buildCommands } from './commands/index.js';
import { createHealthServer } from './services/HealthServer.js';
import { registerReadyHandler } from './events/ready.js';
import { registerInteractionHandler } from './events/interactionCreate.js';
import { registerVoiceStateHandler } from './events/voiceStateUpdate.js';
import type { BotContext } from './types/command.js';

const LOGIN_RETRY_MS = 10_000;

async function loginWithRetry(client: Client, token: string): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await client.login(token);
      return;
    } catch (error) {
      logger.error(`Discord login failed (attempt ${attempt}): ${error}`);
      await new Promise((resolve) => setTimeout(resolve, LOGIN_RETRY_MS));
    }
  }
}

async function main(): Promise<void> {
  const config = loadConfig();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  // Without an error listener, a single gateway/API error crashes the process.
  client.on('error', (error) => logger.error(`Discord client error: ${error}`));

  const shoukaku = createShoukaku(client, config);
  const manager = new MusicManager(client, shoukaku, config);
  const context: BotContext = { client, manager, config };
  const commands = buildCommands(context);

  registerReadyHandler(client, config, commands);
  registerInteractionHandler(client, context, commands);
  registerVoiceStateHandler(client, manager, config);

  const healthServer = createHealthServer(() => manager.getHealthState());
  healthServer.listen(config.PORT, () => {
    logger.info(`Health server listening on port ${config.PORT}.`);
  });

  await loginWithRetry(client, config.DISCORD_TOKEN);

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down...`);
    for (const guildId of manager.activeGuildIds()) {
      await manager.disconnect(guildId);
    }
    healthServer.close();
    client.destroy();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.fatal(`Fatal startup error: ${error}`);
  process.exit(1);
});
