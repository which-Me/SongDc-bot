import type { Client } from 'discord.js';
import { Connectors, Constants, Shoukaku, type NodeOption } from 'shoukaku';
import type { AppConfig } from '../config/env.js';
import { logger } from '../config/logger.js';

export function createShoukaku(client: Client, config: AppConfig): Shoukaku {
  const nodeOptions: NodeOption = {
    name: config.LAVALINK_NAME,
    url: `${config.LAVALINK_HOST}:${config.LAVALINK_PORT}`,
    auth: config.LAVALINK_PASSWORD,
  };

  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), [nodeOptions], {
    resume: true,
    resumeTimeout: 30,
    moveOnDisconnect: true,
    reconnectInterval: 5,
    reconnectTries: Infinity,
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

  shoukaku.on('debug', (name, info) => {
    logger.debug({ node: name }, `${info}`);
  });

  // ponytail: shoukaku's connect() loop can hang forever on a half-open handshake
  // (e.g. Lavalink accepting TCP mid-boot), leaving the node CONNECTING but never
  // ready and no further retries. `reconnectTries: Infinity` only helps when an
  // attempt fails fast; a stalled attempt blocks the whole loop. This watchdog
  // re-arms the node via the public removeNode/addNode API when no retry has
  // happened for a while. Tradeoff: each re-arm can orphan one stuck socket
  // connection to Lavalink until the bot restarts.
  let lastActivity = Date.now();
  shoukaku.on('ready', () => {
    lastActivity = Date.now();
  });
  shoukaku.on('reconnecting', () => {
    lastActivity = Date.now();
  });

  setInterval(() => {
    if (!client.isReady()) return;
    const node = shoukaku.nodes.get(config.LAVALINK_NAME);
    if (node) {
      if (node.state === Constants.State.CONNECTED) return;
      if (Date.now() - lastActivity < 15_000) return;
      logger.warn({ node: node.name }, 'Lavalink reconnect stalled; re-arming node.');
      shoukaku.removeNode(node.name);
    }
    shoukaku.addNode(nodeOptions);
    lastActivity = Date.now();
  }, 5_000).unref();

  return shoukaku;
}
