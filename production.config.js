// Production configuration for hosting providers
export const productionConfig = {
  // Server configuration
  port: process.env.PORT || 5000,
  host: '0.0.0.0',
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // Discord bot configuration
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    required: false, // Bot is optional for web interface
  },
  
  // Security settings
  session: {
    secret: process.env.SESSION_SECRET || 'discord-curator-monitoring-session-secret',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // CORS settings
  cors: {
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: true,
  },
  
  // Build settings
  build: {
    outDir: 'dist',
    sourceMaps: false,
    minify: true,
  },
};