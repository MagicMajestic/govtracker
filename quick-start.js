#!/usr/bin/env node

/**
 * Quick Start script for Discord Bot (bypasses slow npm install)
 * Use this if npm install takes too long
 */

const { spawn } = require('child_process');

console.log('🚀 Quick Start for Discord Bot Curator System...');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function quickStart() {
  try {
    // Skip npm install if node_modules exists
    console.log('⚡ Skipping dependency installation (using existing node_modules)');
    
    // Build project
    console.log('🔨 Building project...');
    await runCommand('npx', ['vite', 'build']);
    await runCommand('npx', ['esbuild', 'server/index.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outdir=dist']);
    
    // Setup database
    console.log('🗄️ Setting up database...');
    await runCommand('npx', ['drizzle-kit', 'push']);
    
    // Start server
    console.log('🎯 Starting server...');
    await runCommand('node', ['dist/index.js']);
    
  } catch (error) {
    console.error('❌ Quick start failed:', error.message);
    console.error('💡 Try the regular index.js instead');
    process.exit(1);
  }
}

quickStart();