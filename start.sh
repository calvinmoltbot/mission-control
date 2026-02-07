#!/bin/bash

# Mission Control Dashboard Startup Script
# Usage: ./start.sh [port]

PORT=${1:-3010}

echo "🃏 Starting Mission Control Dashboard..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting server on port $PORT..."
echo "Dashboard will be available at: http://localhost:$PORT"
echo ""

# Start the dev server
npm run dev -- --port $PORT
