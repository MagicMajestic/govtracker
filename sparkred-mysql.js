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

// Start the server
try {
  console.log('🚀 Starting main server...');
  require('./server/index.ts');
} catch (error) {
  console.error('❌ Server startup failed:', error);
  
  // Try to use tsx if available
  console.log('🔄 Trying with tsx...');
  const { spawn } = require('child_process');
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  server.on('error', (error) => {
    console.error('❌ Failed to start with tsx:', error);
    process.exit(1);
  });
}