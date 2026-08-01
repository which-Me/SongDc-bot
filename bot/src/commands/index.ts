import type { BotContext, BotCommand } from '../types/command.js';
import type { CommandCollection } from '../services/CommandService.js';
import { Collection } from 'discord.js';
import { playCommand } from './play.js';
import { pauseCommand } from './pause.js';
import { resumeCommand } from './resume.js';
import { skipCommand } from './skip.js';
import { stopCommand } from './stop.js';
import { queueCommand } from './queue.js';
import { removeCommand } from './remove.js';
import { moveCommand } from './move.js';
import { shuffleCommand } from './shuffle.js';
import { loopCommand } from './loop.js';
import { volumeCommand } from './volume.js';
import { seekCommand } from './seek.js';
import { jumpCommand } from './jump.js';
import { clearCommand } from './clear.js';
import { disconnectCommand } from './disconnect.js';
import { nowPlayingCommand } from './nowplaying.js';
import { autoplayCommand } from './autoplay.js';
import { historyCommand } from './history.js';
import { previousCommand } from './previous.js';
import { helpCommand } from './help.js';
import { pingCommand } from './ping.js';
import { statsCommand } from './stats.js';

const commandList: BotCommand[] = [
  playCommand,
  pauseCommand,
  resumeCommand,
  skipCommand,
  stopCommand,
  queueCommand,
  removeCommand,
  moveCommand,
  shuffleCommand,
  loopCommand,
  volumeCommand,
  seekCommand,
  jumpCommand,
  clearCommand,
  disconnectCommand,
  nowPlayingCommand,
  autoplayCommand,
  historyCommand,
  previousCommand,
  helpCommand,
  pingCommand,
  statsCommand,
];

export function buildCommands(_context: BotContext): CommandCollection {
  const collection = new Collection<string, BotCommand>();
  for (const command of commandList) {
    collection.set(command.data.name, command);
  }
  return collection;
}
