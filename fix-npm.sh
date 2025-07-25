#!/bin/bash

# Script to fix npm installation issues on SparkredHost
echo "🔧 Fixing npm issues..."

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Remove problematic node_modules
echo "🗑️ Removing node_modules..."
rm -rf node_modules package-lock.json

# Reinstall dependencies for production
echo "📦 Installing dependencies..."
npm install --production --no-optional

echo "✅ npm issues fixed!"