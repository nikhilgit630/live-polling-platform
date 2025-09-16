# Full-Stack Polling Application Setup Guide

## Project Overview
This is a full-stack real-time polling application with:
- **Backend**: Node.js/Express server with PostgreSQL, Prisma ORM, and Socket.IO
- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS

## Quick Start (Run Both Servers)

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Environment Setup
\`\`\`bash
cp .env.example .env
\`\`\`

Configure your `.env` file with:
\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/polling_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
CORS_ORIGINS="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_WS_URL="http://localhost:3000"
\`\`\`

### 3. Database Setup
\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Seed with sample data (optional)
npm run db:seed
\`\`\`

### 4. Run Both Servers Together
\`\`\`bash
npm run dev:all
\`\`\`

This will start:
- **Backend** on `http://localhost:3000` (API + WebSocket)
- **Frontend** on `http://localhost:3001` (Next.js app)

## Individual Server Commands

### Backend Only
\`\`\`bash
npm run dev          # Development mode with nodemon
npm start            # Production mode
\`\`\`

### Frontend Only
\`\`\`bash
npm run frontend     # Development mode
npm run frontend:build && npm run frontend:start  # Production mode
\`\`\`

## Server Details

### Backend (Port 3000)
- **API Endpoints**: `/api/auth/*`, `/api/polls/*`, `/api/votes/*`
- **WebSocket**: Real-time updates for voting
- **Health Check**: `GET /health`

### Frontend (Port 3001)
- **Main App**: Authentication, dashboard, poll creation/voting
- **Real-time Updates**: Connected to backend WebSocket
- **Routes**: `/`, `/dashboard`, `/poll/[id]`

## Database Management

\`\`\`bash
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:migrate   # Run migrations (production)
npm run db:push      # Push schema changes (development)
\`\`\`

## Production Deployment

1. Build frontend: `npm run frontend:build`
2. Set production environment variables
3. Run migrations: `npm run db:migrate`
4. Start backend: `npm start`
5. Start frontend: `npm run frontend:start`

## Troubleshooting

- **Port conflicts**: Change ports in scripts if 3000/3001 are occupied
- **Database connection**: Ensure PostgreSQL is running and DATABASE_URL is correct
- **CORS issues**: Update CORS_ORIGINS in .env to match your frontend URL
- **WebSocket connection**: Ensure NEXT_PUBLIC_WS_URL matches your backend URL
