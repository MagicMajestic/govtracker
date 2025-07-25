#!/bin/bash

# Script to fix Git divergent branches issue on SparkredHost
echo "🔧 Fixing Git divergent branches..."

# Set merge strategy to avoid conflicts
git config pull.rebase false

# Force reset to remote main branch
echo "🔄 Resetting to remote main branch..."
git reset --hard origin/main

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

echo "✅ Git issues fixed!"