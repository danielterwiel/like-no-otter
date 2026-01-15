#!/bin/bash
set -e

EXPO_PORT=8081
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting Expo web server..."
cd "$PROJECT_DIR"

# Start Expo in web mode in background (CI=1 for non-interactive)
CI=1 npx expo start --web --port $EXPO_PORT &
EXPO_PID=$!

# Cleanup function
cleanup() {
    echo "Stopping Expo server..."
    kill $EXPO_PID 2>/dev/null || true
    # Kill any remaining expo processes
    pkill -f "expo start" 2>/dev/null || true
}
trap cleanup EXIT

# Wait for server to be ready
echo "Waiting for server to be ready..."
npx wait-on "http://localhost:$EXPO_PORT" --timeout 120000

# Give Metro time to do initial bundle - trigger a build and wait for it
echo "Triggering initial bundle build..."
# Request the bundle to trigger Metro to build it
curl -s "http://localhost:$EXPO_PORT/index.bundle?platform=web" > /dev/null &
CURL_PID=$!

# Wait for the bundle to be ready (Metro shows 100%)
echo "Waiting for bundle to complete..."
for i in {1..120}; do
    sleep 2
    # Check if curl completed (bundle is ready)
    if ! kill -0 $CURL_PID 2>/dev/null; then
        echo "Bundle ready!"
        break
    fi
    echo "  Still bundling... ($i)"
done

# Extra wait for the page to be fully interactive
sleep 5

echo "Server ready. Running E2E tests..."
echo ""

# Run the E2E test runner
npx tsx scripts/e2e-runner.ts "$@"
