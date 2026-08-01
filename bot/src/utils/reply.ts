import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { EMBED_COLOR } from '../constants/index.js';

type ReplyPayload = { embeds: EmbedBuilder[] } | { content: string };

export function successEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(EMBED_COLOR).setDescription(description);
}

/** Replies if the interaction has not been replied to yet, otherwise edits. */
export async function sendReply(
  interaction: ChatInputCommandInteraction,
  payload: ReplyPayload,
  ephemeral = false,
): Promise<void> {
  if (interaction.replied || interaction.deferred) {
    await interaction.editReply(payload);
    return;
  }
  await interaction.reply({ ...payload, ephemeral });
}
