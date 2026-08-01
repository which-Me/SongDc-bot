import { PROGRESS_BAR_LENGTH } from '../constants/index.js';

/**
 * Renders a text progress bar, e.g. `▰▰▰▰▱▱▱▱▱▱`.
 */
export function progressBar(currentMs: number, totalMs: number, length = PROGRESS_BAR_LENGTH): string {
  if (totalMs <= 0) return '▱'.repeat(length);

  const filled = Math.min(length, Math.max(0, Math.round((currentMs / totalMs) * length)));
  return '▰'.repeat(filled) + '▱'.repeat(length - filled);
}
