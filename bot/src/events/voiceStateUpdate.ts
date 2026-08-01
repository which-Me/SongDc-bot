import type { Client } from 'discord.js';
import type { AppConfig } from '../config/env.js';
import type { MusicManager } from '../services/MusicManager.js';

export function registerVoiceStateHandler(
  client: Client,
  manager: MusicManager,
  config: AppConfig,
): void {
  client.on('voiceStateUpdate', (_oldState, newState) => {
    const guildId = newState.guild.id;
    const player = manager.get(guildId);
    if (!player) return;

    // The bot itself left or was disconnected from voice.
    if (newState.id === client.user?.id && !newState.channelId) {
      void manager.disconnect(guildId);
      return;
    }

    // Nobody is left in the player's voice channel -> schedule a disconnect.
    const channelId = player.voiceChannelId;
    if (!channelId) return;
    const channel = newState.guild.channels.cache.get(channelId);
    if (channel?.isVoiceBased() && channel.members.size <= 1) {
      setTimeout(() => {
        const latest = manager.get(guildId);
        if (latest && !latest.playing) void manager.disconnect(guildId);
      }, config.AUTO_LEAVE_EMPTY_MS);
    }
  });
}
