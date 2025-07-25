#!/bin/bash

# Production startup script for SparkredHost
echo "🚀 Starting production deployment..."

# Fix Git issues first
if [[ -d .git ]]; then
    echo "🔧 Fixing Git issues..."
    git config pull.rebase false
    git reset --hard origin/main 2>/dev/null || true
    git pull origin main 2>/dev/null || echo "Git pull failed, continuing..."
fi

# Fix npm issues
echo "🔧 Fixing npm issues..."
npm cache clean --force 2>/dev/null || true
rm -rf node_modules/.package-lock.json 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production --no-optional

# Ensure tsx is available for development mode
echo "🔧 Installing tsx..."
npm install tsx

# Start the application
echo "🎯 Starting application..."
node index.js