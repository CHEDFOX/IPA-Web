# The whole site: public pages, /admin, the API and the media server, in one container.
# Uploads and the SQLite database live in /app/data, which must be a mounted volume.
FROM node:22-bookworm-slim AS base
# ffmpeg makes video uploads work (poster frames and durations); sharp needs nothing extra.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# A build never reads the database, but next.config checks the environment.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS run
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV IPA_DATA_DIR=/app/data
ENV PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY package.json next.config.ts proxy.ts ./
COPY scripts ./scripts
COPY lib ./lib
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
