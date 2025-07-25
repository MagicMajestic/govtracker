# Руководство по развертыванию Discord Bot Curator Monitoring System

## Для SparkredHost и других хостинг-провайдеров

### Исправление проблем Git

**Ошибка "divergent branches":**
```bash
# Запустить автоматическое исправление
bash fix-git.sh

# Или вручную:
git config pull.rebase false
git reset --hard origin/main
git pull origin main
```

### Исправление проблем npm

**Ошибка "ENOTEMPTY: directory not empty":**
```bash
# Запустить автоматическое исправление
bash fix-npm.sh

# Или вручную:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --production --no-optional
```

### Готовый скрипт для SparkredHost

**Полный скрипт исправления и запуска:**
```bash
# Запустить полное исправление и деплой
bash production-start.sh
```

Этот скрипт автоматически:
1. Исправляет проблемы Git
2. Очищает npm кэш
3. Переустанавливает зависимости
4. Запускает приложение

### Переменные окружения

Обязательные переменные для продакшна:

```bash
# База данных PostgreSQL
DATABASE_URL=postgresql://username:password@host:port/database

# Discord Bot (опционально)
DISCORD_BOT_TOKEN=your_discord_bot_token

# Среда выполнения
NODE_ENV=production

# Порт (обычно устанавливается хостинг-провайдером)
PORT=3000
```

### Команды запуска

**Для SparkredHost в панели управления (выберите один):**

**Вариант 1 (НОВЫЙ - для проблемных серверов):**
1. **STARTUP_FILE**: `simple-server.js`
2. **Команда запуска**: `node simple-server.js`

**Вариант 2 (РЕЗЕРВНЫЙ - если ничего не работает):**
1. **STARTUP_FILE**: `fallback-server.js`
2. **Команда запуска**: `node fallback-server.js`

**Вариант 3:**
1. **STARTUP_FILE**: `server.js`
2. **Команда запуска**: `node server.js`

**Вариант 4:**
1. **STARTUP_FILE**: `production-start.sh`
2. **Команда запуска**: `bash production-start.sh`

**Способы запуска (в порядке надежности для SparkredHost):**

```bash
# 1. ДЛЯ ПРОБЛЕМНЫХ СЕРВЕРОВ (избегает модульных ошибок)
node simple-server.js

# 2. РЕЗЕРВНЫЙ ВАРИАНТ (всегда работает)
node fallback-server.js

# 3. ОБЫЧНЫЙ ПРОСТОЙ
node server.js

# 4. Полное исправление и запуск
bash production-start.sh

# 5. Основной способ запуска
node index.js

# 6. Автоматическая сборка и запуск
node deploy.js

# 7. Развертывание вручную
npm run build && npm start
```

### Структура развертывания

1. **Установка зависимостей**: `npm install --production`
2. **Сборка проекта**: `npm run build`
3. **Инициализация БД**: `npm run db:push` (если база данных пустая)
4. **Запуск**: `npm start`

### Решение проблем

**Если сборка не удается:**
- Скрипт автоматически переключится на режим разработки
- Будет использован `tsx` для запуска TypeScript напрямую

**Если отсутствуют зависимости:**
- Проверьте файл `package.json`
- Убедитесь, что все пакеты установлены: `npm list`

**Если база данных недоступна:**
- Проверьте `DATABASE_URL`
- Создайте таблицы: `npm run db:push`

### Файлы для деплоя

- `server.js` - **САМЫЙ ПРОСТОЙ** запуск для SparkredHost (решает все проблемы)
- `index.js` - **ОСНОВНОЙ** скрипт запуска для всех хостинг-провайдеров
- `production-start.sh` - **ПОЛНЫЙ** скрипт исправления для SparkredHost
- `fix-git.sh` - Исправление проблем Git
- `fix-npm.sh` - Исправление проблем npm
- `start.js` - Альтернативный скрипт запуска
- `deploy.js` - Скрипт развертывания с автосборкой
- `package.json` - Зависимости и скрипты
- `drizzle.config.ts` - Конфигурация базы данных

### Минимальные требования

- Node.js v16+ (рекомендуется v18+)
- PostgreSQL 12+
- 512MB RAM minimum
- 1GB диска для зависимостей

### Порты и сеть

- Приложение автоматически определяет порт из `process.env.PORT`
- По умолчанию: `5000`
- Поддерживает CORS для фронтенда
- API доступно на `/api/*`

### Мониторинг

Логи показывают:
- ✅ Успешные операции
- ⚠️ Предупреждения
- ❌ Ошибки
- 🔄 Процессы в работе

### Discord Bot

Discord бот не обязателен для работы веб-интерфейса:
- Без токена: только веб-интерфейс
- С токеном: полный мониторинг Discord серверов