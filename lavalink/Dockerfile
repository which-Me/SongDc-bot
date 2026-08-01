# Official Lavalink v4 image (Ubuntu 22.04), extended with:
#   - yt-dlp   (LavaSrc "ytdlp" source audio extractor, static binary, no Python)
#   - curl     (already present in the base image; used by the healthcheck)
FROM ghcr.io/lavalink-devs/lavalink:4

USER root

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

USER lavalink

HEALTHCHECK --interval=10s --timeout=5s --retries=10 --start-period=20s \
    CMD curl -f http://localhost:2333/v4/info || exit 1
