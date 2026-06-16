#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "▶  Installing dependencies..."
npm install

echo "▶  Starting dev server..."
npm run dev
