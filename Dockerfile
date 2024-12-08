FROM oven/bun:1 as builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy all other files
COPY . .

# Build the app
RUN bun run build

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/build build/
COPY --from=builder /app/package.json .

# Install only production dependencies
RUN bun install --production --frozen-lockfile

# Start the app
CMD ["bun", "run", "start"]
