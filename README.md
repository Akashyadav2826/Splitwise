# Splitwise Clone

A full-stack expense-splitting app built with React, Node.js/Express, PostgreSQL, and Socket.io.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Local Setup

### 1. Database

```bash
createdb splitwise
psql splitwise -f db/schema.sql
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET
npm install --ignore-scripts
npm run dev
```

### 3. Frontend (separate terminal)

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Production Build

```bash
# Build frontend into server/public
cd client && npm run build
cp -r dist ../server/client/dist

# Build and start server
cd ../server
npm run build
npm start
```

Or use Docker:

```bash
docker build -t splitwise .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=your_secret \
  splitwise
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `PORT` | Server port (default: 3000) |
| `CLIENT_ORIGIN` | Allowed CORS origin in dev |

## API Overview

See `AI_CONTEXT.md` §9 for full API reference.

## Architecture

See `AI_CONTEXT.md` for complete source-of-truth documentation.
