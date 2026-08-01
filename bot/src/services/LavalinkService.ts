import type { Client } from 'discord.js';
import { Connectors, Constants, Shoukaku, type NodeOption } from 'shoukaku';
import type { AppConfig } from '../config/env.js';
import { logger } from '../config/logger.js';

export function createShoukaku(client: Client, config: AppConfig): Shoukaku {
  const nodes: NodeOption[] = [
    {
      name: config.LAVALINK_NAME,
      url: `${config.LAVALINK_HOST}:${config.LAVALINK_PORT}`,
      auth: config.LAVALINK_PASSWORD,
    },
  ];

  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
    resume: true,
    resumeTimeout: 30,
    moveOnDisconnect: true,
    reconnectInterval: 5,
    reconnectTries: 10,
    restTimeout: 10_000,
    nodeResolver: (available) =>
      [...available.values()].find((node) => node.state === Constants.State.CONNECTED),
  });

  shoukaku.on('ready', (name) => {
    logger.info(`Lavalink node "${name}" is ready.`);
  });

  shoukaku.on('error', (name, error) => {
    logger.error({ node: name }, `Lavalink node error: ${error}`);
  });

  shoukaku.on('close', (name, code) => {
    logger.warn({ node: name, code }, 'Lavalink node connection closed.');
  });

  return shoukaku;
}
