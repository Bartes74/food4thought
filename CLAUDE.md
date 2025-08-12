# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Food 4 Thought is a local podcast application with a React frontend and Node.js/Express backend, using SQLite for data storage. The application serves audio content with multi-language support (Polish/English/French) and features user management, progress tracking, admin controls, and a comprehensive achievement system.

## Development Commands

```bash
# Start development (both frontend and backend)
./start.sh                    # Starts backend (port 3001) and frontend (port 3000)
./stop.sh                     # Stops all processes

# Individual services
npm run dev                   # Start backend with nodemon (port 3001)
npm run client               # Start Vite dev server (port 3000)

# Production
npm run build                # Build frontend for production
npm start                    # Start production backend
npm run preview              # Preview production build

# Testing
npm test                     # Run backend tests (Jest)
npm run test:e2e            # Run E2E tests (Playwright)
npm run test:coverage       # Run tests with coverage

# Setup
npm install                  # Install all dependencies
```

## Architecture

**Dual-server setup:**
- Backend: Express server on port 3001 serving `/api/*` endpoints
- Frontend: Vite dev server on port 3000 with proxy configuration
- Database: SQLite at `/food4thought.db`
- Static files: Audio, transcripts, and images served from `/public/`

**Key directories:**
- `src/client/` - React frontend with Vite
- `src/server/` - Express backend
- `public/audio/` - Audio files organized by series
- `public/arkusze/` - Text transcripts
- `public/series-images/` - Series cover images

## Tech Stack

**Backend:**
- Node.js with ES modules (`"type": "module"`)
- Express.js with CORS and rate limiting
- SQLite3 with native SQL queries
- JWT authentication with bcryptjs
- Multer for file uploads
- node-cron for scheduled tasks

**Frontend:**
- React 18 with functional components
- Vite for development and building
- React Router DOM v7
- Tailwind CSS with custom theming
- Axios with authentication interceptors
- Context API for state management (Auth, Language, Theme)

**Testing:**
- Jest for backend unit/integration tests
- Playwright for E2E testing
- 100% test coverage for backend (142/142 tests)
- Comprehensive E2E test suite

## Database Schema

Core tables: `users`, `series`, `episodes`, `listening_sessions`, `user_favorites`, `ratings`, `achievements`, `user_achievements`

**Achievement System:**
- 19 unique achievements (recently fixed from 1928 duplicates)
- Automatic unlocking based on user activity
- Progress tracking in real-time
- Categories: listening, ratings, favorites, series

Default super admin account: `admin@food4thought.local` / `admin`

## Authentication & Authorization

- JWT tokens stored in localStorage
- Role-based access: `user`, `admin`, `super_admin`
- Protected routes with middleware validation
- Authentication context provider manages login state

## Key Features

- Multi-language i18n support (Polish/English/French)
- Dark/Light theme toggle with Tailwind CSS
- Audio playback with progress tracking
- User favorites and rating system
- Achievement system with 19 unique badges
- Admin content management and user moderation
- File upload handling for audio and images
- Comprehensive statistics and analytics

## Recent Fixes (v2.0.1)

### Achievement System Fix
- **Problem**: Database contained 1928 duplicate achievements instead of 19 unique ones
- **Solution**: Removed duplicates and orphaned records
- **Result**: Correct achievement count displayed in UI (19 instead of 1942)
- **Script**: `fix_achievements_duplicates.sql` available for future fixes

### Test Suite Improvements
- **Backend**: 142/142 tests passing (100%)
- **E2E**: All Playwright tests passing
- **Added**: `data-testid` attributes for better test targeting
- **Optimized**: Playwright configuration and timeouts

## Development Notes

- Frontend uses React Context for global state (no Redux)
- Backend uses native SQL queries (no ORM)
- Static file serving integrated with Express
- Vite proxy configuration handles API routing during development
- Custom color palette defined in Tailwind config
- Comprehensive test suite with Jest and Playwright
- Achievement system with automatic progress tracking

## Testing Status

- ✅ **Backend**: 142/142 tests passing (100%)
- ✅ **E2E**: All Playwright tests passing
- ✅ **Coverage**: Complete functionality coverage
- ✅ **Performance**: Optimized test execution times

## Database Integrity

- ✅ **Achievements**: 19 unique achievements (fixed from 1928 duplicates)
- ✅ **User Data**: All user achievements preserved during cleanup
- ✅ **Performance**: Improved query performance after cleanup
- ✅ **Backup**: SQL script available for future maintenance