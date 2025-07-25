#!/usr/bin/env node

// Ultra-simple server for SparkredHost - avoids complex module loading issues
console.log('🚀 Starting ultra-simple server...');

const fs = require('fs');
const { spawn, execSync } = require('child_process');

// Set basic environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const port = process.env.PORT || 5000;

console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
console.log(`📡 Port: ${port}`);

// Simple function to check if file exists
function fileExists(path) {
  try {
    return fs.existsSync(path);
  } catch (error) {
    return false;
  }
}

// Simple function to run command safely
function runCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    console.warn(`⚠️ Command failed: ${command}`);
    return null;
  }
}

// Fix Git issues
console.log('🔧 Fixing Git issues...');
runCommand('git config pull.rebase false');

// Clear npm cache
console.log('🧹 Clearing npm cache...');
runCommand('npm cache clean --force');

// Check what we have
const hasBuiltVersion = fileExists('./dist/index.js');
const hasServerSource = fileExists('./server/index.ts');

console.log(`🏗️ Built version exists: ${hasBuiltVersion}`);
console.log(`📁 Server source exists: ${hasServerSource}`);

if (hasBuiltVersion) {
  // Try built version first
  console.log('🎯 Starting built application...');
  try {
    require('./dist/index.js');
    console.log('✅ Built application started successfully');
  } catch (error) {
    console.warn('⚠️ Built version failed, trying to rebuild...');
    tryBuildAndStart();
  }
} else if (hasServerSource) {
  // Try to build first
  console.log('🔨 No built version found, building...');
  tryBuildAndStart();
} else {
  console.error('❌ No server files found');
  process.exit(1);
}

function tryBuildAndStart() {
  console.log('🔨 Attempting to build project...');
  
  // Try to build
  const buildResult = runCommand('npm run build');
  
  if (buildResult !== null && fileExists('./dist/index.js')) {
    console.log('✅ Build successful, starting built application...');
    try {
      require('./dist/index.js');
      console.log('✅ Application started successfully');
    } catch (error) {
      console.error('❌ Failed to start built application:', error.message);
      tryDirectStart();
    }
  } else {
    console.warn('⚠️ Build failed, trying direct start...');
    tryDirectStart();
  }
}

function tryDirectStart() {
  console.log('🔄 Attempting direct TypeScript execution...');
  
  // Install tsx if needed
  console.log('📦 Ensuring tsx is available...');
  runCommand('npm install tsx');
  
  // Start with tsx using simpler approach
  console.log('🎯 Starting TypeScript server...');
  
  const server = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  server.on('error', (err) => {
    console.error('❌ TypeScript execution failed:', err.message);
    
    // Last resort - try with ts-node
    console.log('🔄 Trying with ts-node...');
    runCommand('npm install ts-node typescript');
    
    const tsServer = spawn('npx', ['ts-node', 'server/index.ts'], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    tsServer.on('error', (tsErr) => {
      console.error('❌ All methods failed:', tsErr.message);
      console.log('💡 Manual steps:');
      console.log('1. npm install');
      console.log('2. npm run build');
      console.log('3. npm start');
      process.exit(1);
    });
  });
  
  console.log('✅ Server process started');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  // Don't exit immediately, let other methods try
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  // Don't exit immediately, let other methods try
});