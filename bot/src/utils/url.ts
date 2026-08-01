export function isUrl(value: string): boolean {
  return /^(https?:\/\/)/i.test(value);
}

export function isSpotifyUrl(value: string): boolean {
  return /^https:\/\/(open\.)?spotify\.com\//i.test(value);
}
