import http from 'node:http';
import type { HealthState } from './MusicManager.js';

function renderMetrics(state: HealthState): string {
  const wsPing = Number.isFinite(state.wsPing) ? state.wsPing : -1;
  return [
    '# HELP discord_bot_uptime_seconds Bot process uptime in seconds.',
    '# TYPE discord_bot_uptime_seconds gauge',
    `discord_bot_uptime_seconds ${state.uptimeSeconds}`,
    '# HELP discord_bot_active_players Currently active voice players.',
    '# TYPE discord_bot_active_players gauge',
    `discord_bot_active_players ${state.activePlayers}`,
    '# HELP discord_bot_ws_ping Discord gateway latency in ms.',
    '# TYPE discord_bot_ws_ping gauge',
    `discord_bot_ws_ping ${wsPing}`,
    '# HELP discord_bot_lavalink_connected Whether the Lavalink node is connected.',
    '# TYPE discord_bot_lavalink_connected gauge',
    `discord_bot_lavalink_connected ${state.lavalinkConnected ? 1 : 0}`,
    '# HELP discord_bot_client_ready Whether the Discord client is ready.',
    '# TYPE discord_bot_client_ready gauge',
    `discord_bot_client_ready ${state.clientReady ? 1 : 0}`,
    '',
  ].join('\n');
}

export function createHealthServer(getState: () => HealthState): http.Server {
  return http.createServer((req, res) => {
    if (req.url === '/metrics') {
      res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4; charset=utf-8' });
      res.end(renderMetrics(getState()));
      return;
    }

    if (req.url === '/health' || req.url === '/') {
      const state = getState();
      const healthy = state.lavalinkConnected;
      res.writeHead(healthy ? 200 : 503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: healthy ? 'ok' : 'degraded', ...state }));
      return;
    }

    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
  });
}
