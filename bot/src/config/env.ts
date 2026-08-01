import { z } from 'zod';

/** Optional env var that falls back to a default when unset or empty. */
function numberFromEnv(defaultValue: number) {
  return z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === '' ? defaultValue : Number(value)))
    .refine((value) => !Number.isNaN(value), { message: 'Expected a valid number' });
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
  GUILD_ID: z.string().optional(),

  LAVALINK_HOST: z.string().default('lavalink'),
  LAVALINK_PORT: numberFromEnv(2333),
  LAVALINK_NAME: z.string().default('main'),
  LAVALINK_REGION: z.string().default('auto'),
  LAVALINK_PASSWORD: z.string().default('changeme_youshallnotpass'),

  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),

  PORT: numberFromEnv(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  DEFAULT_VOLUME: numberFromEnv(100),
  AUTO_LEAVE_EMPTY_MS: numberFromEnv(60_000),
  MAX_QUEUE_SIZE: numberFromEnv(1000),
  MAX_PLAYLIST_TRACKS: numberFromEnv(200),
  MAX_SEARCH_RESULTS: numberFromEnv(5),
  REQUEST_TIMEOUT_MS: numberFromEnv(10_000),
});

export type AppConfig = z.infer<typeof EnvSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return result.data;
}
