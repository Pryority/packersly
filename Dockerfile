FROM oven/bun:1 as builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy all other files
COPY . .

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

# Install only production dependencies
RUN bun install --production --frozen-lockfile

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose the port your app runs on from Environment variables
EXPOSE ${PORT}

# Start the app
CMD ["bun", "run", "start"]
