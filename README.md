# Snowball Analytics

Production-style full-stack portfolio analytics app with a quantitative **Snowball Quality Score** engine.

## Tech Stack
- Frontend: React + TypeScript + Tailwind + Recharts
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma ORM
- Testing: Vitest + Supertest + Testing Library

## Features
- Snowball Quality Score (0-100) from fundamentals
- Portfolio health gauge (weighted by position value)
- Price vs Quality scatter matrix (bubble size = position value)
- Moat exposure distribution
- Asset score cards with breakdown table
- Dynamic data fetching from backend APIs

## Prerequisites
- Node.js 20+
- npm
- Homebrew (macOS) for automatic PostgreSQL install/bootstrap

## One-command setup
```bash
npm run setup
```

This installs dependencies, installs/starts PostgreSQL locally (if needed), pushes Prisma schema, and seeds demo data.

## Run
```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:4000](http://localhost:4000)

## Test
```bash
npm test
```

## Build
```bash
npm run build
```

## Key API Endpoints
- `GET /api/portfolios`
- `GET /api/analytics/portfolio-health?portfolioId=1`
- `GET /api/analytics/matrix?portfolioId=1`
- `GET /api/analytics/holdings?portfolioId=1`

## Project Structure
- `/Users/alberto/Documents/uipath/personal/backend`
- `/Users/alberto/Documents/uipath/personal/frontend`

## DB Scripts
- `npm run db:bootstrap` (install/start local PostgreSQL and write backend env)
- `npm run db:push`
- `npm run db:seed`
- `npm run db:stop`
