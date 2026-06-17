#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "▶  Installing dependencies..."
npm install

# Kill any existing Vite process on port 5173 before starting
if lsof -ti :5173 &>/dev/null; then
  echo "▶  Killing existing process on port 5173..."
  lsof -ti :5173 | xargs kill -9
fi

echo "▶  Starting dev server (hot reload is automatic — keep this running)..."
npm run dev
