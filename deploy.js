#!/usr/bin/env node

// Deployment script for SparkredHost and other hosting providers
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🚀 Starting deployment process...');

// Function to run commands with error handling
async function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('warn')) {
      console.warn(`⚠️ Warning: ${stderr}`);
    }
    if (stdout) {
      console.log(`✅ ${description} completed`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error in ${description}:`, error.message);
    return false;
  }
}

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`🌍 Environment: ${isProduction ? 'Production' : 'Development'}`);

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.log('📝 Make sure to set these in your hosting environment');
}

// Build the application
async function buildApp() {
  console.log('🔨 Building application...');
  
  // Build frontend
  const frontendBuild = await runCommand('npx vite build', 'Building frontend');
  if (!frontendBuild) {
    console.error('❌ Frontend build failed');
    process.exit(1);
  }
  
  // Build backend
  const backendBuild = await runCommand(
    'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist',
    'Building backend'
  );
  if (!backendBuild) {
    console.error('❌ Backend build failed');
    process.exit(1);
  }
  
  console.log('✅ Application built successfully');
}

// Start the application
async function startApp() {
  console.log('🎯 Starting application...');
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Import and start the server
  try {
    await import('./dist/index.js');
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
  }
}

// Main deployment function
async function deploy() {
  try {
    // Check if dist directory exists, if not build
    if (!fs.existsSync('./dist')) {
      await buildApp();
    }
    
    // Start the application
    await startApp();
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy();
}

export { buildApp, startApp, deploy };