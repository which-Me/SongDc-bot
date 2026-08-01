import { describe, expect, it } from 'vitest';
import { formatDuration } from '../src/utils/format';
import { progressBar } from '../src/utils/progress';
import { isUrl } from '../src/utils/url';

describe('formatDuration', () => {
  it('formats zero and negatives as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(-5)).toBe('0:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(30_000)).toBe('0:30');
  });

  it('formats hours', () => {
    expect(formatDuration(3_661_000)).toBe('1:01:01');
  });
});

describe('progressBar', () => {
  it('renders an empty bar at position zero', () => {
    expect(progressBar(0, 1000, 4)).toBe('▱▱▱▱');
  });

  it('renders a full bar at the end', () => {
    expect(progressBar(1000, 1000, 4)).toBe('▰▰▰▰');
  });

  it('handles zero-length tracks without dividing by zero', () => {
    expect(progressBar(0, 0, 4)).toBe('▱▱▱▱');
  });
});

describe('isUrl', () => {
  it('detects http(s) URLs', () => {
    expect(isUrl('https://www.youtube.com/watch?v=abc')).toBe(true);
    expect(isUrl('some song name')).toBe(false);
  });
});
