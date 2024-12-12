FROM oven/bun:1 as builder
WORKDIR /app
# Copy package files first for better caching
COPY package.json bun.lockb ./
# Install dependencies
RUN bun install --frozen-lockfile
# Copy all other files
COPY . .
ENV DB_HOST=dummy
ENV DB_USER=dummy
ENV DB_PASSWORD=dummy
ENV DB_NAME=dummy
ENV DB_PORT=5432
ENV DATABASE_URL=postgresql://dummy:dummy@dummy:5432/dummy
# Build the SvelteKit application
RUN bun run build

# Production image
FROM oven/bun:1-slim
WORKDIR /app
# Copy built assets from builder
COPY --from=builder /app/.svelte-kit ./.svelte-kit
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/bun.lockb .
COPY --from=builder /app/src ./src
COPY --from=builder /app/src/lib/server/db/schema ./src/lib/server/db/schema
COPY --from=builder /app/src/lib/env.ts ./src/lib/env.ts
COPY --from=builder /app/drizzle.config.ts .
COPY --from=builder /app/drizzle ./drizzle

# Install only production dependencies
RUN bun install --production --frozen-lockfile
# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV ORIGIN="https://packersly-production.up.railway.app"
# Expose the port your app runs on from Environment variables
EXPOSE ${PORT}
# Push Drizzle schema and start the app
CMD ORIGIN="https://packersly-production.up.railway.app" bun db:migrate && bun run start
