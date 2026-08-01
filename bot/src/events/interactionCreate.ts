import { MessageFlags, type AutocompleteInteraction, type Client } from 'discord.js';
import { logger } from '../config/logger.js';
import type { BotContext } from '../types/command.js';
import type { CommandCollection } from '../services/CommandService.js';
import { errorEmbed } from '../utils/embeds.js';

// Discord requires an autocomplete response within 3s; stay well under it.
const AUTOCOMPLETE_TIMEOUT_MS = 2_500;

export function registerInteractionHandler(
  client: Client,
  context: BotContext,
  commands: CommandCollection,
): void {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction, context);
        return;
      }

      if (!interaction.isChatInputCommand()) return;

      const command = commands.get(interaction.commandName);
      if (!command) {
        await interaction.reply({
          embeds: [errorEmbed('Unknown command', 'This command is not registered yet.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await command.execute(interaction, context);
    } catch (error) {
      logger.error(`Interaction error: ${error}`);
      if (!interaction.isChatInputCommand()) return;
      logger.error({ command: interaction.commandName }, `Command failed: ${error}`);
      try {
        const embed = errorEmbed('Error', 'An unexpected error occurred. Please try again.');
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
      } catch {
        // Interaction already expired or was handled; nothing more to do.
      }
    }
  });
}

async function handleAutocomplete(interaction: AutocompleteInteraction, context: BotContext): Promise<void> {
  if (interaction.commandName !== 'play') {
    await interaction.respond([]);
    return;
  }

  const query = interaction.options.getFocused().toString().trim();
  if (query.length < 3) {
    await interaction.respond([]);
    return;
  }

  const result = await Promise.race([
    context.manager.search(query, interaction.user.id, 5),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), AUTOCOMPLETE_TIMEOUT_MS)),
  ]).catch(() => null);
  if (!result) {
    await interaction.respond([]);
    return;
  }

  const tracks =
    result.type === 'search' ? result.tracks : result.type === 'track' ? [result.track] : result.tracks;
  const suggestions = tracks
    .slice(0, 5)
    .map((track) => ({ name: `${track.title} — ${track.author}`.slice(0, 100), value: track.title }));
  await interaction.respond(suggestions);
}
