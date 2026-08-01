# Discord Music Bot

A production-ready Discord music bot built with **discord.js v14**, **Shoukaku**, and
**Lavalink v4**. It runs entirely in Docker — the host machine only needs Docker,
nothing else (no Node.js, Java, FFmpeg, or yt-dlp).

## Features

- Slash commands with autocomplete, channel-aware permission guards
- Audio sources: **YouTube**, **Spotify**, **SoundCloud**, **local files** (via LavaSrc + yt-dlp)
- Full playback control: queue, loop (track/queue), shuffle, move, remove, jump, seek, volume
- Autoplay (plays similar tracks when the queue ends), playback history, previous track
- Auto-leaves the voice channel when empty or idle
- Health + Prometheus metrics endpoint for container orchestration
- Fully containerized: identical behavior on Windows, WSL2, macOS, and any Linux distro

## Requirements

- **Docker** 24+ with Docker Compose v2 (Docker Desktop on Windows/macOS works too)
- A Discord bot application with a **token** and its **Client ID** from the
  [Discord Developer Portal](https://discord.com/developers/applications)

## Quick Start

```bash
cp .env.example .env
# edit .env and fill in DISCORD_TOKEN and CLIENT_ID
docker compose up -d --build
```

Verify:

```bash
docker compose ps
curl http://localhost:3000/health   # {"status":"ok", ...}
```

Invite the bot to your server (scopes: `bot` + `applications.commands`), then use
`/play <song>` in any text channel.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `DISCORD_TOKEN` | — | **Required.** Bot token. |
| `CLIENT_ID` | — | **Required.** Application Client ID. |
| `GUILD_ID` | — | If set, slash commands register only in this guild (instant). Empty = global. |
| `LAVALINK_PASSWORD` | `changeme_youshallnotpass` | Shared secret between bot and Lavalink. |
| `SPOTIFY_CLIENT_ID` | — | Spotify API client ID (enables Spotify source). |
| `SPOTIFY_CLIENT_SECRET` | — | Spotify API client secret. |
| `PORT` | `3000` | Health/metrics HTTP port (inside the bot container). |
| `BOT_PORT` | `3000` | Host port mapped to the bot's health/metrics port. |
| `DEFAULT_VOLUME` | `100` | Starting volume (0–200). |
| `AUTO_LEAVE_EMPTY_MS` | `60000` | Delay before leaving an empty voice channel. |
| `MAX_QUEUE_SIZE` | `1000` | Max tracks per queue. |
| `MAX_PLAYLIST_TRACKS` | `200` | Max tracks loaded from a playlist. |
| `LOG_LEVEL` | `info` | Pino log level. |

## Commands

| Command | Description |
| --- | --- |
| `/play <query> [source]` | Play a song, playlist, or search (source: auto/youtube/spotify/soundcloud/local). |
| `/pause` `/resume` `/skip` | Basic playback control. |
| `/stop` | Stop playback, clear the queue, leave voice. |
| `/queue [page]` | Show the queue. |
| `/remove <position>` `/move <from> <to>` | Manage queue entries. |
| `/shuffle` | Shuffle the queue. |
| `/loop <track\|queue\|off>` | Loop mode. |
| `/volume [level]` | Show or set volume. |
| `/seek <seconds>` `/jump <position>` | Seek / jump to a queue position. |
| `/clear` `/disconnect` | Clear the queue / leave voice. |
| `/nowplaying` `/history` `/previous` | Current, recent, and previous tracks. |
| `/autoplay` | Toggle autoplay. |
| `/help` `/ping` `/stats` | Utility commands. |

## Local files

Put audio files in `./music` (mounted into the containers). Then:

```
/play path/to/song.mp3 source:local
```

## Development

Run the bot outside Docker (Lavalink still runs in Docker):

```bash
docker compose up -d lavalink
cd bot
pnpm install
pnpm dev
```

Quality gates:

```bash
pnpm lint        # ESLint
pnpm format:check
pnpm typecheck
pnpm test        # Vitest
```

## Project Structure

```
├── docker-compose.yml      # bot + lavalink orchestration
├── .env.example
├── lavalink/
│   ├── application.yml     # Lavalink v4 + LavaSrc + YouTube plugin config
│   └── Dockerfile          # base image + yt-dlp + curl
└── bot/
    ├── Dockerfile          # multi-stage node:22 build
    ├── src/
    │   ├── index.ts        # bootstrap: client, shoukaku, health server
    │   ├── config/         # zod-validated env + pino logger
    │   ├── commands/       # 22 slash commands
    │   ├── events/         # ready, interactionCreate, voiceStateUpdate
    │   ├── middleware/     # command guards (voice/player)
    │   ├── music/          # TrackQueue + MusicPlayer (shoukaku wrapper)
    │   ├── services/       # MusicManager, LavalinkService, CommandService, HealthServer
    │   ├── types/          # shared types
    │   └── utils/          # embeds, format, progress, reply
    └── tests/              # Vitest unit tests
```

## Troubleshooting

- **Health returns `503` / `degraded`** → the bot is running but not fully ready:
  Lavalink is still starting/failed, or the bot has not connected to Discord yet.
  Check `docker compose logs lavalink` / `docker compose logs bot`.
- **First `docker compose up` is slow** → Lavalink auto-downloads the YouTube and
  LavaSrc plugin jars from `maven.lavalink.dev` on first boot (one-time).
- **`DISCORD_TOKEN is required`** → `.env` is missing or incomplete; compose fails fast with a clear message.
- **Commands don't appear** → without `GUILD_ID`, global command registration can take up to an hour.
  Set `GUILD_ID` for instant registration.
- **Spotify tracks fail to play** → Spotify needs `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`.
  YouTube/SoundCloud work without any credentials.

## License

MIT — see [LICENSE](LICENSE).
