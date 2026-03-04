#!/bin/bash
# Auto-deploy: checks for new commits on main and deploys if found
# Runs every 2 minutes via launchd

set -e

PROJECT_DIR="/Users/player/clawd/projects/repurpose"
LOG="/tmp/repurpose-deploy.log"
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

cd "$PROJECT_DIR"

# Fetch latest
git fetch origin main --quiet 2>/dev/null

# Compare local and remote
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    exit 0
fi

echo "[$(date -u +%FT%TZ)] New commits detected: $LOCAL → $REMOTE" >> "$LOG"

# Pull
git pull origin main --quiet >> "$LOG" 2>&1

# Install deps
npm install --production=false >> "$LOG" 2>&1

# DB migration
npx drizzle-kit push >> "$LOG" 2>&1

# Build
rm -rf .next
npm run build >> "$LOG" 2>&1

# Restart
launchctl stop com.aditor.repurpose
sleep 2
launchctl start com.aditor.repurpose

echo "[$(date -u +%FT%TZ)] Deploy complete ✓" >> "$LOG"
