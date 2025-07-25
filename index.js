#!/usr/bin/env node

/**
 * Starter script for Discord Bot Curator Monitoring System
 * This file handles the startup process for SparkedHosts/Pterodactyl hosting
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Discord Bot Curator Monitoring System...');
console.log('📦 Node.js version:', process.version);

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';
console.log('🔧 Environment:', isProduction ? 'production' : 'development');

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const fullCommand = `${command} ${args.join(' ')}`;
    console.log(`🔄 Running: ${fullCommand}`);
    console.log(`📁 Working directory: ${process.cwd()}`);
    console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      console.log(`✅ Command completed with exit code: ${code} at ${new Date().toLocaleTimeString()}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.log(`❌ Command error: ${error.message}`);
      reject(error);
    });
  });
}

// Function to check if dependencies are installed
function checkDependencies() {
  console.log('🔍 Checking dependencies...');
  try {
    const nodeModulesExists = fs.existsSync('node_modules');
    console.log(`📦 node_modules exists: ${nodeModulesExists}`);
    
    if (nodeModulesExists) {
      const packageCount = fs.readdirSync('node_modules').length;
      console.log(`📊 Packages in node_modules: ${packageCount}`);
      
      // Check for critical build dependencies
      const viteExists = fs.existsSync('node_modules/vite');
      const esbuildExists = fs.existsSync('node_modules/esbuild');
      console.log(`🔧 vite available: ${viteExists}`);
      console.log(`🔧 esbuild available: ${esbuildExists}`);
      
      // Only return true if we have both build tools
      return viteExists && esbuildExists;
    }
    
    const distExists = fs.existsSync('dist');
    console.log(`🏗️ dist folder exists: ${distExists}`);
    
    if (distExists) {
      const distFiles = fs.readdirSync('dist');
      console.log(`📁 Files in dist: ${distFiles.join(', ')}`);
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Error checking dependencies: ${error.message}`);
    return false;
  }
}

// Main startup function
async function start() {
  try {
    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      throw new Error('❌ package.json not found! Make sure all project files are uploaded.');
    }

    // Check current state
    const depsInstalled = checkDependencies();
    
    if (!depsInstalled) {
      console.log('📦 Installing dependencies...');
      
      // Clear specific problematic packages
      if (fs.existsSync('node_modules/drizzle-kit')) {
        console.log('🗑️ Removing problematic drizzle-kit...');
        await runCommand('rm', ['-rf', 'node_modules/drizzle-kit']);
      }
      
      // Clear npm cache to avoid conflicts
      console.log('🧹 Clearing npm cache...');
      await runCommand('npm', ['cache', 'clean', '--force']);
      
      // Install all dependencies (including dev deps for building)
      await runCommand('npm', ['install']);
      console.log('✅ Dependencies installed successfully');
      checkDependencies(); // Check again after install
    } else {
      console.log('✅ Dependencies already installed');
    }

    // Check if TypeScript files need to be compiled
    if (!fs.existsSync('dist') || fs.readdirSync('dist').length === 0) {
      console.log('🔨 Building TypeScript project...');
      console.log('📁 Using npx to run local build tools...');
      
      // Build frontend with vite
      console.log('🎨 Building frontend...');
      await runCommand('npx', ['vite', 'build']);
      
      // Build backend with esbuild  
      console.log('⚙️ Building backend...');
      await runCommand('npx', ['esbuild', 'server/index.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outdir=dist']);
      
      console.log('✅ TypeScript build completed');
    } else {
      console.log('✅ Project already built');
    }

    // Check if the main dist file exists
    if (!fs.existsSync('dist/index.js')) {
      throw new Error('❌ dist/index.js not found after build! Check if npm run build completed successfully.');
    }

    // Push database schema if needed
    console.log('🗄️ Setting up database schema...');
    try {
      await runCommand('npm', ['run', 'db:push']);
      console.log('✅ Database schema updated');
    } catch (error) {
      console.log('⚠️  Database schema update failed (this might be normal if DB is already set up)');
    }

    // Start the application
    console.log('🎯 Starting the application...');
    console.log('📡 Discord Bot will connect after startup');
    console.log('🌐 Web interface will be available once server starts');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Start the production server
    await runCommand('npm', ['start']);

  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    console.error('💡 Make sure you have:');
    console.error('   - Uploaded all project files (package.json, server/, client/, shared/)');
    console.error('   - Set DATABASE_URL environment variable');
    console.error('   - Set DISCORD_BOT_TOKEN environment variable');
    console.error('   - Set NODE_ENV=production');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the application
start();