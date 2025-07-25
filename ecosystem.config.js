// PM2 ecosystem configuration for production deployment
module.exports = {
  apps: [{
    name: 'discord-curator-monitor',
    script: './start.js',
    
    // Instance configuration
    instances: 1,
    exec_mode: 'fork',
    
    // Environment
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000
    },
    
    // Monitoring
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log',
      'dist',
      '.git'
    ],
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // Advanced settings
    source_map_support: false,
    instance_var: 'INSTANCE_ID',
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Health monitoring
    health_check_grace_period: 3000,
    
    // Environment variables
    env_file: '.env',
    
    // Startup optimization
    node_args: '--max-old-space-size=1024'
  }]
};