import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

import * as schema from "@shared/schema";

// MySQL connection configuration for SparkredHost
const connectionConfig = {
  host: 'db-par-02.apollopanel.com',
  port: 3306,
  user: 'u182643_kxUTQsjKxw',
  database: 's182643_govtracker',
  // Password will be provided via environment variable
  password: process.env.DB_PASSWORD || '',
  ssl: false,
  timezone: '+00:00'
};

console.log('🔌 Connecting to MySQL database...');
console.log(`Host: ${connectionConfig.host}:${connectionConfig.port}`);
console.log(`Database: ${connectionConfig.database}`);
console.log(`User: ${connectionConfig.user}`);

export const pool = mysql.createPool(connectionConfig);
export const db = drizzle(pool, { schema, mode: 'default' });

// Test connection
pool.getConnection().then(connection => {
  console.log('✅ MySQL connection successful');
  connection.release();
}).catch(error => {
  console.error('❌ MySQL connection failed:', error.message);
});