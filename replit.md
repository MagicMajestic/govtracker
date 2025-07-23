# Discord Bot Curator Monitoring System

## Overview

This is a full-stack Discord bot monitoring application designed for a roleplay server community (Majestic RP SF). The system tracks curator activity across multiple Discord servers, monitoring messages, reactions, and replies to provide insights into engagement and performance.

## User Preferences

Preferred communication style: Simple, everyday language.

## Complete System Recreation Instructions

### Project Purpose
A Discord bot that monitors curator (moderator) activities across multiple roleplay servers, tracking response times, performance ratings, and generating real-time analytics. Built for Russian-speaking roleplay community "Majestic RP SF".

### Database Schema & Core Data Structure

**Main Tables (PostgreSQL):**
```sql
-- Curators (moderators)
curators: id, discord_id, name, factions[], curator_type, active
-- Discord servers to monitor  
discord_servers: id, server_id, name, role_tag_id, is_active
-- Activity tracking
activities: id, curator_id, server_id, type, channel_id, message_id, content, timestamp
-- Response time tracking (CRITICAL for system)
response_tracking: id, server_id, curator_id, mention_message_id, mention_timestamp, response_message_id, response_timestamp, response_type, response_time_seconds
-- User management  
users: id, discord_id, username, role
```

**Response Tracking Logic (Core Feature):**
1. Bot detects messages with keywords: "куратор", "curator", "помощь", "help", "вопрос", "question"
2. Creates `response_tracking` record using REAL message timestamps (not artificial ones)
3. When curator responds (message/reaction), calculates actual response time based on message creation timestamps
4. Prevents duplicate tracking entries for same message
5. Calculates realistic performance metrics from authentic response times

### Discord Bot Integration

**Monitored Servers (8 total):**
- Government, FIB, LSPD, SANG, LSCSD, EMS, Weazel News, Detectives
- Bot connects as "Curator#2772"
- Real-time monitoring of messages, reactions, replies

**Bot Functionality:**
- Message monitoring with content analysis
- Reaction tracking for response times
- Activity classification (message/reaction/reply)
- Response time calculation from mentions to curator responses
- Automatic database logging

### Frontend Architecture

**Technology Stack:**
- React 18 + TypeScript
- Wouter for routing
- Tailwind CSS + shadcn/ui components
- TanStack Query for server state
- Vite for development

**Page Structure:**
```
/ - Dashboard (statistics, charts, activity feed)
/curators - Curator management with performance ratings
/curators/:id - Detailed curator stats and activity history  
/servers - Discord server management
/activity - Activity history and logs
/settings - Bot configuration
```

**Key Components:**
- Sidebar navigation with bot status indicator
- Activity charts (daily/weekly statistics)
- Performance rating system (Великолепно/Хорошо/Нормально/Плохо/Ужасно)
- Real-time statistics updates
- Russian language interface

### Performance Rating System

**Rating Thresholds:**
- Великолепно (Excellent): 50+ points
- Хорошо (Good): 35+ points  
- Нормально (Normal): 20+ points
- Плохо (Poor): 10+ points
- Ужасно (Terrible): <10 points

**Score Calculation:**
Based on activity count and response times. Lower response times = higher scores.

### Backend API Architecture

**Core Endpoints:**
```
GET /api/dashboard/stats - Main dashboard statistics
GET /api/curators - List all curators
GET /api/curators/:id/stats - Individual curator performance
GET /api/activities/recent - Recent activity feed
GET /api/activities/daily - Daily activity charts
GET /api/top-curators - Leaderboard with rankings
GET /api/servers - Discord server management
```

**Real-time Updates:**
- Response time tracking via `response_tracking` table
- Activity logging from Discord events
- Performance calculations updated on each API call

### Technical Implementation Details

**Development Commands:**
```bash
npm run dev - Start development servers (Express + Vite)
npm run db:push - Push schema changes to database
```

**Environment Variables:**
- DATABASE_URL (PostgreSQL connection via Neon)
- DISCORD_BOT_TOKEN (Bot authentication - connects as "Curator#2772")
- PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER (Auto-configured)

**File Structure:**
```
/client - React frontend
/server - Express backend + Discord bot
/shared - Shared TypeScript schemas
server/discord-bot.ts - Main bot logic
server/storage.ts - Database operations
shared/schema.ts - Database schemas
```

### Critical Implementation Notes

1. **Response Tracking is Core Feature** - System creates response_tracking records using REAL message timestamps, not artificial data
2. **Real-time Statistics** - All metrics auto-update every 10 seconds via React Query (refetchInterval: 10000, staleTime: 5000)
3. **Unified Rating System** - Use `/lib/rating.ts` for consistent rating across all components  
4. **Russian Interface** - All text in Russian for roleplay community
5. **Performance Rating** - Uses realistic thresholds: Великолепно (50+), Хорошо (35+), Нормально (20+), Плохо (10+), Ужасно (<10)
6. **Bot Status Integration** - Show online status in sidebar menu (not as overlay)
7. **Response Time Accuracy** - Uses authentic Discord message timestamps, prevents duplicate tracking entries
8. **Auto-Updates** - Dashboard, curator lists, and detail pages sync automatically without manual refresh

### Data Flow Process
1. Discord message → Bot detection → Database logging with real timestamps
2. Keywords detected → response_tracking record created using authentic message creation time
3. Curator response → realistic response time calculated from Discord timestamps → performance updated
4. Frontend → API auto-refresh every 10s → Real-time statistics → UI updates without page reload

### Styling Requirements
- Dark theme with blue accents
- Professional dashboard design
- Responsive layout
- Bot status indicator in navigation menu
- Activity type color coding (blue/red/green)

This system provides comprehensive curator monitoring with real-time performance analytics specifically designed for Discord roleplay server management.

## Recent Changes

### July 23, 2025 - Система мониторинга кураторов Discord - ЗАВЕРШЕНА

**✅ МИГРАЦИЯ И ОСНОВНАЯ ФУНКЦИОНАЛЬНОСТЬ ЗАВЕРШЕНЫ**
- **✅ Полная миграция из Replit Agent в Replit среду**
- **✅ PostgreSQL база данных через Neon Database настроена и работает**
- **✅ Discord bot "Curator#2772" подключен и мониторит 8 серверов**
- **✅ Все зависимости установлены: React, Express, Drizzle ORM, Discord.js**
- **✅ Frontend: React + TypeScript + Tailwind CSS + shadcn/ui компоненты**
- **✅ Backend: Express + TypeScript + Discord bot интеграция**

**✅ СИСТЕМА ВРЕМЕНИ ОТВЕТА - ИСПРАВЛЕНА И ОПТИМИЗИРОВАНА**
- **✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Убраны все фиктивные записи времени ответа (1-2 сек)**
- **✅ ИСПРАВЛЕНА ЛОГИКА: Теперь использует реальные временные метки Discord сообщений**
- **✅ ПРЕДОТВРАЩЕНИЕ ДУБЛИКАТОВ: Система не создает повторные записи для одного сообщения**
- **✅ РЕАЛИСТИЧНЫЕ ДАННЫЕ: Среднее время ответа показывает реальные значения (6+ секунд)**
- **✅ ТОЧНЫЕ РАСЧЕТЫ: Время считается от создания сообщения до ответа куратора**

**✅ REAL-TIME ОБНОВЛЕНИЯ - ПОЛНОСТЬЮ РАБОТАЮТ**
- **✅ Автоматическое обновление каждые 10 секунд (React Query: refetchInterval: 10000)**
- **✅ Кэширование настроено правильно (staleTime: 5000, refetchOnWindowFocus: true)**
- **✅ Дашборд обновляется без перезапуска приложения**
- **✅ Статистика синхронизируется на всех страницах одновременно**

**✅ ИНТЕРФЕЙС И НАВИГАЦИЯ**
- **✅ Единая система рейтингов через /lib/rating.ts**
- **✅ Статус бота в боковом меню (убран надоедливый overlay)**
- **✅ Русский интерфейс для roleplay сообщества**
- **✅ Адаптивный дизайн с темной темой**

**✅ ПРОИЗВОДИТЕЛЬНОСТЬ И СТАБИЛЬНОСТЬ**
- **✅ Оптимизированные SQL запросы для быстрого отклика**
- **✅ Правильная обработка Discord API событий**
- **✅ Стабильное подключение к PostgreSQL через connection pooling**
- **✅ Error handling и логирование для отладки**

**ГОТОВО К ИСПОЛЬЗОВАНИЮ:** Система полностью функциональна и готова для мониторинга кураторов Discord серверов в реальном времени с точными метриками производительности.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query v5 for server state (auto-refresh every 10s)
- **Build Tool**: Vite for development and bundling
- **Real-time Updates**: Configured with refetchInterval: 10000, staleTime: 5000

### Backend Architecture  
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL  
- **Database Provider**: Neon Database (serverless PostgreSQL with connection pooling)
- **Discord Integration**: Discord.js v14 for bot functionality
- **Response Tracking**: Authentic timestamp-based calculation system

### Project Structure
- `/client` - React frontend application
- `/server` - Express backend and Discord bot
- `/shared` - Shared TypeScript schemas and types
- `/components.json` - shadcn/ui configuration

## Key Components

### Database Schema
- **curators** - Stores curator information (Discord ID, name, faction, status)
- **discordServers** - Configured Discord servers to monitor
- **activities** - Tracks all curator actions (messages, reactions, replies)
- **users** - User authentication and management (future use)

### Discord Bot Integration
- **Bot Identity**: "Curator#2772" - authenticated and operational
- **Monitored Servers**: 8 roleplay servers (Government, FIB, LSPD, SANG, LSCSD, EMS, Weazel News, Detectives)
- **Activity Types**: Messages, reactions, and replies with full metadata tracking
- **Response Time Logic**: Uses real Discord message timestamps, prevents duplicate tracking
- **Keywords Detection**: "куратор", "curator", "помощь", "help", "вопрос", "question"
- **Real-time Processing**: Immediate activity logging with authentic timestamp calculation

### Frontend Features
- Dashboard with activity statistics and charts
- Curator management (add, edit, delete)
- Real-time activity monitoring
- Server status tracking
- Russian language interface for roleplay community

### API Endpoints
- `/api/dashboard/stats` - Dashboard statistics
- `/api/curators` - Curator CRUD operations
- `/api/activities/recent` - Recent activity feed
- `/api/servers` - Discord server management

## Data Flow

1. **Discord Events** → Discord.js captures message/reaction events with authentic timestamps
2. **Activity Processing** → Bot validates curator and server, calculates real response times
3. **Database Storage** → Activities and response_tracking stored via Drizzle ORM to PostgreSQL
4. **API Layer** → Express routes serve live data to frontend every 10 seconds
5. **Real-time Updates** → React Query auto-refreshes with optimized caching strategy
6. **UI Rendering** → Components display synchronized stats, charts, and activity feeds without manual refresh

## External Dependencies

### Core Technologies
- **@neondatabase/serverless** - Serverless PostgreSQL connection
- **discord.js** - Discord bot framework
- **drizzle-orm** - Type-safe SQL ORM
- **@tanstack/react-query** - Server state management
- **@radix-ui/*** - Accessible UI primitives (via shadcn/ui)

### Development Tools
- **tsx** - TypeScript execution for development
- **esbuild** - Fast bundling for production server
- **vite** - Frontend development server and bundling

## Deployment Strategy

### Development (Current Setup)
- **Frontend**: Vite dev server with HMR (Hot Module Replacement)
- **Backend**: tsx with file watching for TypeScript execution
- **Database**: Drizzle migrations with `npm run db:push`
- **Bot**: Discord.js connected as "Curator#2772" with real-time monitoring

### Production Ready Configuration
- **Frontend**: Vite builds optimized bundle to `dist/public`
- **Backend**: esbuild bundles server to `dist/index.js`
- **Database**: PostgreSQL via Neon with connection pooling and optimized queries
- **Monitoring**: Real-time activity tracking with authentic response time calculation

### Environment Variables (Configured)
- `DATABASE_URL` - Neon PostgreSQL connection (✅ Set)
- `DISCORD_BOT_TOKEN` - Bot authentication as "Curator#2772" (✅ Set)
- `PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER` - Auto-configured by Replit

### Architectural Decisions

**Database Choice**: PostgreSQL via Neon was chosen for its serverless scaling, built-in connection pooling, and compatibility with Drizzle ORM's type safety features.

**ORM Selection**: Drizzle provides excellent TypeScript integration, migration management, and query performance compared to alternatives like Prisma.

**State Management**: TanStack Query eliminates the need for complex client state management while providing caching, background updates, and optimistic updates.

**UI Framework**: shadcn/ui + Radix provides accessible, customizable components without the bundle size of complete UI libraries.

**Monorepo Structure**: Shared types between client/server prevent API contract drift and enable full-stack type safety.

The system prioritizes real-time monitoring, type safety, and maintainability while supporting the specific needs of a Discord-based roleplay community.