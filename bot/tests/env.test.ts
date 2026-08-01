import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/env';

describe('loadConfig', () => {
  it('parses required values and defaults', () => {
    const config = loadConfig({ DISCORD_TOKEN: 'token', CLIENT_ID: '123' } as NodeJS.ProcessEnv);
    expect(config.DISCORD_TOKEN).toBe('token');
    expect(config.CLIENT_ID).toBe('123');
    expect(config.PORT).toBe(3000);
    expect(config.DEFAULT_VOLUME).toBe(100);
    expect(config.LAVALINK_HOST).toBe('lavalink');
  });

  it('parses numeric env values', () => {
    const config = loadConfig({
      DISCORD_TOKEN: 'token',
      CLIENT_ID: '123',
      PORT: '8080',
      DEFAULT_VOLUME: '70',
    } as NodeJS.ProcessEnv);
    expect(config.PORT).toBe(8080);
    expect(config.DEFAULT_VOLUME).toBe(70);
  });

  it('throws when required variables are missing', () => {
    expect(() => loadConfig({} as NodeJS.ProcessEnv)).toThrow('Invalid environment configuration');
  });
});
