import { MessageFlags, type ChatInputCommandInteraction, type VoiceBasedChannel } from 'discord.js';
import { GuildMember } from 'discord.js';
import type { MusicPlayer } from '../music/player/MusicPlayer.js';
import type { MusicManager } from '../services/MusicManager.js';
import { errorEmbed } from '../utils/embeds.js';

export function getMemberVoiceChannel(interaction: ChatInputCommandInteraction): VoiceBasedChannel | null {
  const member = interaction.member;
  if (!(member instanceof GuildMember)) return null;
  return member.voice.channel;
}

export function isInSameVoiceChannel(interaction: ChatInputCommandInteraction, player: MusicPlayer): boolean {
  const channel = getMemberVoiceChannel(interaction);
  if (!channel) return false;
  return channel.id === player.voiceChannelId;
}

/** Returns true if the invoker is in a voice channel, otherwise replies with an error. */
export async function requireVoice(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (getMemberVoiceChannel(interaction)) return true;
  await interaction.reply({
    embeds: [errorEmbed('Not in a voice channel', 'Join a voice channel and try again.')],
    flags: MessageFlags.Ephemeral,
  });
  return false;
}

/** Returns the guild's player if one exists, otherwise replies with an error. */
export async function requirePlayer(
  interaction: ChatInputCommandInteraction,
  manager: MusicManager,
): Promise<MusicPlayer | null> {
  const player = manager.get(interaction.guildId ?? '');
  if (player) return player;
  await interaction.reply({
    embeds: [errorEmbed('Nothing is playing', 'Start a song first with `/play`.')],
    flags: MessageFlags.Ephemeral,
  });
  return null;
}

/** Returns the guild's player only when it is actively playing a track. */
export async function requirePlaying(
  interaction: ChatInputCommandInteraction,
  manager: MusicManager,
): Promise<MusicPlayer | null> {
  const player = await requirePlayer(interaction, manager);
  if (!player) return null;
  if (player.current) return player;
  await interaction.reply({
    embeds: [errorEmbed('Nothing is playing', 'Start a song first with `/play`.')],
    flags: MessageFlags.Ephemeral,
  });
  return null;
}
