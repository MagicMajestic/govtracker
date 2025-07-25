#!/usr/bin/env node

// Production startup script for hosting providers
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);

console.log('🚀 Starting Discord Bot Curator Monitoring System...');
console.log(`📦 Node.js version: ${process.version}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

// Check dependencies
console.log('🔍 Checking dependencies...');
const nodeModulesExists = fs.existsSync('./node_modules');
console.log(`📦 node_modules exists: ${nodeModulesExists}`);

if (nodeModulesExists) {
  try {
    const nodeModulesContents = fs.readdirSync('./node_modules');
    console.log(`📊 Packages in node_modules: ${nodeModulesContents.length}`);
    
    // Check for critical packages
    const criticalPackages = ['express', 'discord.js', 'drizzle-orm', 'pg'];
    const missingPackages = criticalPackages.filter(pkg => !nodeModulesContents.includes(pkg));
    
    if (missingPackages.length > 0) {
      console.log(`⚠️ Missing critical packages: ${missingPackages.join(', ')}`);
    } else {
      console.log('✅ All critical packages found');
    }
  } catch (error) {
    console.warn('⚠️ Could not read node_modules directory');
  }
}

// Check if build exists
const distExists = fs.existsSync('./dist');
console.log(`🏗️ Build directory exists: ${distExists}`);

if (!distExists) {
  console.log('🔨 Build not found, building project...');
  
  try {
    // Try to build the project
    const { execSync } = require('child_process');
    
    console.log('🎨 Building frontend...');
    execSync('npx vite build', { stdio: 'inherit' });
    
    console.log('🔧 Building backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
    
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('🔄 Attempting to run development server instead...');
    
    try {
      // Fallback to development mode
      const { spawn } = require('child_process');
      const devServer = spawn('npx', ['tsx', 'server/index.ts'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });
      
      devServer.on('error', (err) => {
        console.error('❌ Failed to start development server:', err.message);
        process.exit(1);
      });
      
      return;
    } catch (devError) {
      console.error('❌ Failed to start development server:', devError.message);
      process.exit(1);
    }
  }
}

// Start the built application
try {
  console.log('🎯 Starting built application...');
  process.env.NODE_ENV = 'production';
  
  // Import and start the server
  import('./dist/index.js').catch(error => {
    console.error('❌ Failed to start application:', error.message);
    console.log('🔄 Attempting fallback to development mode...');
    
    // Fallback to development
    const { spawn } = require('child_process');
    const devServer = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    devServer.on('error', (err) => {
      console.error('❌ Development fallback failed:', err.message);
      process.exit(1);
    });
  });
  
} catch (error) {
  console.error('❌ Failed to start application:', error.message);
  process.exit(1);
}