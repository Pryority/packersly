#!/bin/sh
# Push database schema
echo "Pushing database schema..."
bun db:push

# Start the application
echo "Starting application..."
bun run start
