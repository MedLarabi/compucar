#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/deploy-vps.sh user@server:/var/www/compucar
REMOTE=${1:-}
if [ -z "$REMOTE" ]; then
  echo "Usage: $0 user@server:/var/www/compucar" >&2
  exit 1
fi

echo "[1/4] Building Next.js (standalone)..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm i --frozen-lockfile
  pnpm build
elif command -v yarn >/dev/null 2>&1 && [ -f yarn.lock ]; then
  yarn --frozen-lockfile
  yarn build
else
  npm ci
  npm run build
fi

echo "[2/4] Creating staging bundle..."
TMPDIR=$(mktemp -d)
mkdir -p "$TMPDIR"/bundle
cp -r .next/standalone "$TMPDIR"/bundle/standalone
cp -r .next/static "$TMPDIR"/bundle/.next/static
cp -r public "$TMPDIR"/bundle/public
if [ -f .env.production ]; then cp .env.production "$TMPDIR"/bundle/.env.production; fi

echo "[3/4] Syncing to VPS... ($REMOTE)"
rsync -az --delete "$TMPDIR"/bundle/ "$REMOTE"/

echo "[4/4] Restarting app with PM2 on VPS..."
ssh "${REMOTE%%:*}" "cd ${REMOTE#*:} && pm2 startOrReload ecosystem.config.cjs --only compucar || pm2 start ecosystem.config.cjs --only compucar && pm2 save"

echo "Deploy complete."


