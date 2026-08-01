import type {
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import type { AppConfig } from '../config/env.js';
import type { MusicManager } from '../services/MusicManager.js';

export interface BotContext {
  client: Client;
  manager: MusicManager;
  config: AppConfig;
}

export interface BotCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction, context: BotContext): Promise<void>;
}
