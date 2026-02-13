# Snowball Elite

High-density CRM-style portfolio tracker with a quantitative Snowball quality engine.

## Stack
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- UI: shadcn-style component primitives, Tremor, Lucide React, TanStack Table, Recharts
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL + Prisma
- Tests: Vitest, Supertest, Testing Library

## What is implemented
- Portfolio CRM shell with collapsible sidebar + KPI ticker top bar
- Global search from homepage with dynamic company lookup
- Dedicated stock workspace page (`/stocks/:symbol`) with:
  - real financial statements (SEC where available)
  - valuation / moat / balance-sheet insight cards
  - live quote and news feed
- Snowball quality engine (0-100) + verdict (`BUY` / `HOLD` / `TRIM`)
- Draggable Bento dashboard widgets:
  - Portfolio Health gauge
  - Quality Map (scatter with bubble size by position)
  - Deal Room right drawer (click bubble to drill down)
  - Snowball composed chart (invested capital vs compound layer + future income line)
  - Dividend payout heatmap calendar
  - Moat distribution chart
  - Asset Command Center table (TanStack) with row expansion and score logic
- Portfolio creation from UI/API (fixed workflow)
- Seed data: 20 assets + 5-year portfolio snapshot history

## Backend analytics endpoints
- `GET /api/analytics/portfolio-health?portfolioId=...`
- `GET /api/analytics/matrix?portfolioId=...`
- `GET /api/analytics/holdings?portfolioId=...`
- `GET /api/analytics/kpis?portfolioId=...`
- `GET /api/analytics/snowball?portfolioId=...`
- `GET /api/analytics/payout-calendar?portfolioId=...&year=...`

## Asset endpoints
- `GET /api/assets/search?query=...`
- `GET /api/assets/:symbol/financials`
- `GET /api/assets/:symbol/comprehensive`

## Setup
```bash
npm install
npm run db:bootstrap
npm run db:push
npm run db:seed
```

## Run
```bash
npm run dev
```
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173` (or next free port if already occupied)

## Validate
```bash
npm run lint
npm test
npm run build
```

## Useful scripts
- `npm run db:bootstrap`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:stop`
