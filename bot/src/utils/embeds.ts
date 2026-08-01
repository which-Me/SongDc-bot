import { EmbedBuilder } from 'discord.js';
import { ERROR_EMBED_COLOR, EMBED_COLOR } from '../constants/index.js';
import { formatDuration } from './format.js';
import { progressBar } from './progress.js';
import type { QueueTrack } from '../types/music.js';

export function errorEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(ERROR_EMBED_COLOR).setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

export function trackEmbed(
  title: string,
  track: QueueTrack,
  fields: Array<{ name: string; value: string; inline?: boolean }> = [],
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(title)
    .setDescription(track.title)
    .addFields(
      { name: 'Artist', value: track.author || 'Unknown', inline: true },
      { name: 'Duration', value: track.isStream ? 'LIVE' : formatDuration(track.length), inline: true },
      ...fields,
    );

  if (track.artworkUrl) embed.setThumbnail(track.artworkUrl);
  if (track.uri) embed.setURL(track.uri);

  return embed;
}

export function progressEmbed(track: QueueTrack, position: number): string {
  const bar = progressBar(position, track.length);
  return `\`${bar}\` \`${formatDuration(position)} / ${track.isStream ? 'LIVE' : formatDuration(track.length)}\``;
}
