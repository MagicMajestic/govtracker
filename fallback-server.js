#!/usr/bin/env node

// Fallback server for extreme cases - minimal dependencies
const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting fallback server...');

const port = process.env.PORT || 5000;

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Discord Bot Curator Monitoring System</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a1a; color: #fff; }
            .container { max-width: 800px; margin: 0 auto; }
            .status { background: #333; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .success { border-left: 4px solid #4CAF50; }
            .error { border-left: 4px solid #f44336; }
            .warning { border-left: 4px solid #ff9800; }
            code { background: #222; padding: 2px 6px; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Discord Bot Curator Monitoring System</h1>
            
            <div class="status warning">
                <h3>⚠️ Fallback Mode Active</h3>
                <p>The main application could not start due to Node.js module issues on this hosting provider.</p>
            </div>
            
            <div class="status success">
                <h3>✅ System Information</h3>
                <p><strong>Node.js:</strong> ${process.version}</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>Port:</strong> ${port}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="status error">
                <h3>🔧 Manual Setup Required</h3>
                <p>To fix the application, run these commands on your server:</p>
                <ol>
                    <li><code>git config pull.rebase false</code></li>
                    <li><code>git reset --hard origin/main</code></li>
                    <li><code>rm -rf node_modules package-lock.json</code></li>
                    <li><code>npm cache clean --force</code></li>
                    <li><code>npm install --production</code></li>
                    <li><code>npm run build</code></li>
                    <li><code>npm start</code></li>
                </ol>
            </div>
            
            <div class="status">
                <h3>📞 Support</h3>
                <p>If you continue to have issues, this appears to be a hosting provider compatibility problem with Node.js ESM modules.</p>
                <p>Consider using a different hosting provider or contact your current provider about Node.js v18 ESM support.</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Fallback server running on port ${port}`);
  console.log(`🌐 Access at: http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down fallback server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down fallback server...');
  server.close(() => {
    process.exit(0);
  });
});