# Discord Bot Curator Monitoring System

## Overview

This is a full-stack Discord bot monitoring application designed for a roleplay server community (Majestic RP SF). The system tracks curator activity across multiple Discord servers, monitoring messages, reactions, and replies to provide insights into engagement and performance.

## User Preferences

Preferred communication style: Simple, everyday language.

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