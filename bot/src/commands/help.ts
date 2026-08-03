import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from '../types/command.js';
import { EMBED_COLOR } from '../constants/index.js';
import { sendReply } from '../utils/reply.js';

const COMMANDS: Array<{ name: string; description: string }> = [
  { name: '/play', description: 'Play a song, playlist, or search query (supports source).' },
  { name: '/pause', description: 'Pause the current track.' },
  { name: '/resume', description: 'Resume the current track.' },
  { name: '/skip', description: 'Skip the current track.' },
  { name: '/stop', description: 'Stop playback and leave the voice channel.' },
  { name: '/queue', description: 'Show the current queue.' },
  { name: '/remove', description: 'Remove a track from the queue.' },
  { name: '/move', description: 'Move a track in the queue.' },
  { name: '/shuffle', description: 'Shuffle the queue.' },
  { name: '/loop', description: 'Loop the track or the whole queue.' },
  { name: '/volume', description: 'Show or set the playback volume.' },
  { name: '/seek', description: 'Seek to a position in the current track.' },
  { name: '/jump', description: 'Jump to and play a queue position.' },
  { name: '/clear', description: 'Clear the queue.' },
  { name: '/disconnect', description: 'Disconnect the bot from voice.' },
  { name: '/nowplaying', description: 'Show the current track details.' },
  { name: '/autoplay', description: 'Toggle autoplay.' },
  { name: '/history', description: 'Show recently played tracks.' },
  { name: '/previous', description: 'Play the previous track.' },
  { name: '/ping', description: 'Check bot latency.' },
  { name: '/stats', description: 'Show bot statistics.' },
  { name: '/restart', description: 'Hard-restart the bot process.' },
];

export const helpCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle('Commands')
      .setDescription(COMMANDS.map((command) => `**${command.name}** — ${command.description}`).join('\n'));

    await sendReply(interaction, { embeds: [embed] });
  },
};
