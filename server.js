#!/usr/bin/env node

// Simplified server startup for hosting providers that have issues with complex builds
// This file tries multiple approaches to start the server

console.log('🚀 Starting simplified server...');

const fs = require('fs');
const { spawn, execSync } = require('child_process');

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const port = process.env.PORT || 5000;

console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
console.log(`📡 Port: ${port}`);

// Check if built version exists
const distExists = fs.existsSync('./dist');
console.log(`🏗️ Built version exists: ${distExists}`);

if (distExists) {
  // Try to run built version
  console.log('🎯 Starting built application...');
  try {
    require('./dist/index.js');
  } catch (error) {
    console.error('❌ Built version failed:', error.message);
    startWithTsx();
  }
} else {
  // No built version, try to build first
  console.log('🔨 Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed, starting application...');
    require('./dist/index.js');
  } catch (buildError) {
    console.warn('⚠️ Build failed, trying development mode...');
    startWithTsx();
  }
}

function startWithTsx() {
  console.log('🔄 Starting with tsx (development mode)...');
  
  // Try to install tsx if not available
  try {
    execSync('npm install tsx', { stdio: 'pipe' });
  } catch (installError) {
    console.warn('⚠️ Could not install tsx');
  }
  
  // Start with tsx
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  server.on('error', (err) => {
    console.error('❌ tsx startup failed:', err.message);
    console.log('💡 Try manually: npm install && npm run build && npm start');
    process.exit(1);
  });
  
  console.log('✅ Development server started with tsx');
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