FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl ffmpeg wget
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install --no-audit --no-fund

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time stubs so routes can be statically analyzed. Real values are
# supplied at runtime via docker-compose / environment.
ENV BETTER_AUTH_SECRET=build-time-placeholder-must-be-32-chars-or-more
ENV BETTER_AUTH_URL=http://localhost:3000
ENV PUBLIC_BASE_URL=http://localhost:3000
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
ENV BLOB_STORAGE_ENDPOINT=http://localhost:8080
ENV BLOB_STORAGE_BUCKET=audio
ENV BLOB_STORAGE_ACCESS_KEY=build-time-access-key-placeholder-123456
ENV BLOB_STORAGE_SECRET_KEY=build-time-secret-key-placeholder-1234567890
ENV ADMIN_EMAIL=build@example.com
ENV NOTIFY_EMAIL=build@example.com
ENV SMTP_HOST=localhost
ENV SMTP_PORT=1025
ENV SMTP_USER=build
ENV SMTP_PASS=build
ENV SMTP_FROM="Resonate AI <build@example.com>"
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/db ./src/db
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
RUN chmod +x ./entrypoint.sh
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["sh", "-c", "node server.js"]