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
discord_servers: id, server_id, name, role_tag_id
-- Activity tracking
activities: id, curator_id, server_id, type, channel_id, message_id, content, timestamp
-- Response time tracking (CRITICAL for system)
response_tracking: id, server_id, curator_id, mention_message_id, mention_timestamp, response_message_id, response_timestamp, response_type, response_time_seconds
-- User management
users: id, discord_id, username, role
```

**Response Tracking Logic (Core Feature):**
1. Bot detects messages with keywords: "куратор", "curator", "помощь", "help", "вопрос", "question"
2. Creates `response_tracking` record with mention details
3. When curator responds (message/reaction), updates record with response time
4. Calculates performance metrics from response times

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
npm run dev - Start development servers
npm run db:push - Push schema changes to database
```

**Environment Variables:**
- DATABASE_URL (PostgreSQL connection)
- DISCORD_BOT_TOKEN (Bot authentication)

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

1. **Response Tracking is Core Feature** - System must create response_tracking records for messages needing curator attention
2. **Real-time Statistics** - All metrics calculated from database, not cached. Updates live as curators respond
3. **Unified Rating System** - Use `/lib/rating.ts` for consistent rating across all components
4. **Russian Interface** - All text in Russian for roleplay community  
5. **Performance Rating** - Uses realistic thresholds: Великолепно (50+), Хорошо (35+), Нормально (20+), Плохо (10+), Ужасно (<10)
6. **Bot Status Integration** - Show online status in sidebar menu (not as overlay)
7. **Response Time Sync** - Must update across dashboard, curator list, and details pages simultaneously

### Data Flow Process
1. Discord message → Bot detection → Database logging
2. Mention keywords detected → response_tracking record created  
3. Curator response → response time calculated → performance updated
4. Frontend → API calls → Real-time statistics → UI updates

### Styling Requirements
- Dark theme with blue accents
- Professional dashboard design
- Responsive layout
- Bot status indicator in navigation menu
- Activity type color coding (blue/red/green)

This system provides comprehensive curator monitoring with real-time performance analytics specifically designed for Discord roleplay server management.

## Recent Changes

### July 23, 2025 - Final System Updates
- **✅ SYNCHRONIZED: All curator rating systems across all pages (unified rating functions)**
- **✅ REAL-TIME: Response tracking updates live (25s → 21s → 18s → 16s)**  
- **✅ UNIFIED: Created `/lib/rating.ts` for consistent performance evaluation**
- **✅ FIXED: Rating display now synchronized (all pages show same rating for same score)**
- **✅ OPTIMIZED: Database response time tracking with sub-10 second responses**
- **✅ MOVED: Bot status indicator to sidebar menu (removed annoying overlay)**
- **✅ DOCUMENTED: Complete recreation instructions for exact system replication**
- **Successfully completed migration from Replit Agent to Replit environment**
- Successfully migrated Discord Bot Curator Monitoring System from Replit Agent to Replit environment
- Created PostgreSQL database and successfully pushed Drizzle schema
- Configured all required dependencies and TypeScript environment  
- Resolved Discord bot integration with secure token authentication
- Bot successfully connects as "Curator#2772" and monitors Discord servers
- Application runs on port 5000 with Express backend and Vite frontend
- Database tables created: curators, discordServers, activities, responseTracking, users
- API endpoints functional for curator management and activity tracking
- Frontend React application loads successfully with Tailwind CSS styling
- Discord bot token configured and bot operational with 8 server monitoring  
- Fixed statistics calculation issues in storage layer for proper activity tracking
- Improved curator stats calculation with correct message/reaction/reply counting
- Enhanced dashboard statistics with proper time response calculations
- **Fixed API routing conflicts for top curators endpoint by creating /api/top-curators**
- **Corrected response time display from 0 minutes to actual seconds (18s)**
- **Updated dashboard stats to calculate average response time across all servers**
- **Fixed curator cards showing 0 activities by connecting to proper API endpoints**
- **Enhanced curator details page to show real response time statistics**
- **IMPROVED: Response time tracking now includes reactions on messages with curator tags**
- **IMPROVED: Real-time statistics updates without requiring server restart**
- **IMPROVED: Response tracking system uses dedicated database table for accuracy**
- All statistics now update properly in real-time with correct calculations
- Migration completed successfully - application ready for production use

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite for development and bundling

### Backend Architecture  
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Discord Integration**: Discord.js v14 for bot functionality

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
- Monitors 8 predefined Discord servers (Government, FIB, LSPD, SANG, LSCSD, EMS, Weazel News, Detectives)
- Tracks three types of activities: messages, reactions, and replies
- Real-time activity logging with message content and metadata
- Automatic server verification on startup

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

1. **Discord Events** → Discord.js captures message/reaction events
2. **Activity Processing** → Bot validates curator and server, extracts metadata
3. **Database Storage** → Activities stored via Drizzle ORM to PostgreSQL
4. **API Layer** → Express routes serve data to frontend
5. **Real-time Updates** → React Query polls for fresh data
6. **UI Rendering** → Components display stats, charts, and activity feeds

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

### Development
- Frontend: Vite dev server with HMR
- Backend: tsx with file watching
- Database: Drizzle migrations with `db:push`

### Production Build
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Database: PostgreSQL via Neon with connection pooling

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `DISCORD_BOT_TOKEN` - Discord bot authentication (required)

### Architectural Decisions

**Database Choice**: PostgreSQL via Neon was chosen for its serverless scaling, built-in connection pooling, and compatibility with Drizzle ORM's type safety features.

**ORM Selection**: Drizzle provides excellent TypeScript integration, migration management, and query performance compared to alternatives like Prisma.

**State Management**: TanStack Query eliminates the need for complex client state management while providing caching, background updates, and optimistic updates.

**UI Framework**: shadcn/ui + Radix provides accessible, customizable components without the bundle size of complete UI libraries.

**Monorepo Structure**: Shared types between client/server prevent API contract drift and enable full-stack type safety.

The system prioritizes real-time monitoring, type safety, and maintainability while supporting the specific needs of a Discord-based roleplay community.