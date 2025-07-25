#!/usr/bin/env node

// Special SparkredHost MySQL deployment script
// This file handles MySQL connection for SparkredHost hosting

console.log('🚀 Starting Discord Bot for SparkredHost with MySQL...');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 25887;

// SparkredHost MySQL connection
process.env.DB_HOST = 'db-par-02.apollopanel.com';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'u182643_kxUTQsjKxw';
process.env.DB_NAME = 's182643_govtracker';
// DB_PASSWORD должен быть установлен в переменных окружения SparkredHost

console.log('🔧 MySQL Configuration for SparkredHost:');
console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);

// Check if password is set
if (!process.env.DB_PASSWORD) {
  console.error('❌ DB_PASSWORD environment variable is required!');
  console.log('Set this in SparkredHost panel Environment Variables section');
  process.exit(1);
}

// Temporarily replace db.ts with MySQL version
const fs = require('fs');
const path = require('path');

const mysqlDbContent = `
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

const connectionConfig = {
  host: '${process.env.DB_HOST}',
  port: ${process.env.DB_PORT},
  user: '${process.env.DB_USER}',
  database: '${process.env.DB_NAME}',
  password: process.env.DB_PASSWORD,
  ssl: false
};

console.log('🔌 Connecting to MySQL...');
export const pool = mysql.createPool(connectionConfig);
export const db = drizzle(pool, { schema, mode: 'default' });
`;

// Backup original db.ts
if (fs.existsSync('./server/db.ts') && !fs.existsSync('./server/db-postgres-backup.ts')) {
  fs.copyFileSync('./server/db.ts', './server/db-postgres-backup.ts');
  console.log('📄 Backed up PostgreSQL db.ts');
}

// Write MySQL version
fs.writeFileSync('./server/db.ts', mysqlDbContent);
console.log('✅ Switched to MySQL configuration');

// Build and start the server
console.log('🔧 Building server...');
const { execSync } = require('child_process');

try {
  // Install dependencies if needed
  if (require('fs').existsSync('./package.json')) {
    console.log('📦 Installing dependencies...');
    execSync('npm install --production', { stdio: 'inherit' });
  }
  
  // Try different build methods
  let buildSuccess = false;
  
  // Method 1: Try esbuild
  try {
    console.log('🔨 Building with esbuild...');
    execSync('npx esbuild server/index.ts --bundle --platform=node --format=cjs --outfile=dist/server.js --external:mysql2 --external:discord.js', { stdio: 'inherit' });
    buildSuccess = true;
  } catch (buildError) {
    console.log('⚠️ esbuild failed, trying tsx...');
  }
  
  // Method 2: Try tsx directly
  if (!buildSuccess) {
    console.log('🚀 Starting with tsx...');
    const { spawn } = require('child_process');
    const server = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    server.on('error', (error) => {
      console.error('❌ tsx failed:', error);
      process.exit(1);
    });
    
    process.on('SIGTERM', () => server.kill());
    process.on('SIGINT', () => server.kill());
    return;
  }
  
  // Method 3: Run built file
  if (buildSuccess && require('fs').existsSync('./dist/server.js')) {
    console.log('✅ Running built server...');
    require('./dist/server.js');
  }
  
} catch (error) {
  console.error('❌ All build methods failed:', error);
  console.log('📄 Environment info:');
  console.log(`Node.js: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`CWD: ${process.cwd()}`);
  process.exit(1);
}
