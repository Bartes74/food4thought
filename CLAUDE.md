# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Food 4 Thought is a local podcast application with a React frontend and Node.js/Express backend, using SQLite for data storage. The application serves audio content with multi-language support (Polish/English/French) and features user management, progress tracking, and admin controls.

## Development Commands

```bash
# Start development (both frontend and backend)
./start.sh                    # Starts backend (port 3002) and frontend (port 3000)
./stop.sh                     # Stops all processes

# Individual services
npm run dev                   # Start backend with nodemon (port 3002)
npm run client               # Start Vite dev server (port 3000)

# Production
npm run build                # Build frontend for production
npm start                    # Start production backend
npm run preview              # Preview production build

# Setup
npm install                  # Install all dependencies
```

## Architecture

**Dual-server setup:**
- Backend: Express server on port 3002 serving `/api/*` endpoints
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

## Database Schema

Core tables: `users`, `series`, `episodes`, `user_progress`, `user_favorites`, `ratings`, `comments`, `messages`

Default super admin account: `admin@food4thought.local` / `admin123`

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
- Admin content management and user moderation
- File upload handling for audio and images

## Development Notes

- Frontend uses React Context for global state (no Redux)
- Backend uses native SQL queries (no ORM)
- Static file serving integrated with Express
- Vite proxy configuration handles API routing during development
- Custom color palette defined in Tailwind config