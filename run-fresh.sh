#!/bin/bash
set -e

echo "✓ Cleaning Next.js cache..."
rm -rf .next

echo "✓ Cleaning build cache..."
rm -rf node_modules/.cache

echo "✓ Starting development server..."
npm run dev
