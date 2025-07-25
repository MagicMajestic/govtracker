#!/usr/bin/env node

// Простейший сервер для SparkredHost
console.log('🚀 Simple Discord Bot Server for SparkredHost');

// Установка переменных окружения
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 25887;

// MySQL конфигурация для SparkredHost
process.env.DB_HOST = 'db-par-02.apollopanel.com';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'u182643_kxUTQsjKxw';
process.env.DB_NAME = 's182643_govtracker';

console.log('🔧 MySQL Configuration:');
console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);

if (!process.env.DB_PASSWORD) {
  console.error('❌ DB_PASSWORD environment variable is required!');
  process.exit(1);
}

// Простой Express сервер
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 25887;

// Основные middleware
app.use(express.json());
app.use(express.static('public'));

// Здоровье сервера
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV
  });
});

// Основная страница
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Discord Bot - SparkredHost</title></head>
      <body>
        <h1>🤖 Discord Bot Server</h1>
        <p>Сервер запущен на порту ${PORT}</p>
        <p>База данных: ${process.env.DB_NAME}</p>
        <p>Время: ${new Date().toLocaleString('ru-RU')}</p>
        <p><a href="/health">Health Check</a></p>
      </body>
    </html>
  `);
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📅 Started: ${new Date().toLocaleString('ru-RU')}`);
});

// Обработка завершения
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server interrupted...');
  process.exit(0);
});
