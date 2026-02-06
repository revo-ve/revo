# REVO ⚡

**Tu negocio, evolucionado.**

SaaS de gestión para restaurantes. Diseñado para el mercado venezolano con planes de expansión a Latinoamérica.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

### Setup

```bash
# Clone the repo
git clone <repo-url> revo && cd revo

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start database & Redis
docker compose -f infra/docker-compose.dev.yml up -d

# Run database migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed

# Start all apps in dev mode
pnpm dev
```

### Access

| App | URL | Description |
|-----|-----|-------------|
| Dashboard | http://localhost:5173 | Admin panel + POS |
| Menu | http://localhost:5174 | Public digital menu |
| API | http://localhost:3000/api/v1 | REST API |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (everywhere) |
| Backend | NestJS |
| Frontend | React + Vite |
| Database | PostgreSQL |
| Cache | Redis |
| ORM | Prisma |
| Monorepo | Turborepo + pnpm |
| Deploy | Docker Compose + Nginx |

## Project Structure

```
revo/
├── apps/
│   ├── api/          # NestJS backend
│   ├── dashboard/    # React admin + POS
│   └── menu/         # React public menu
├── packages/
│   ├── shared-types/ # TypeScript types
│   └── validators/   # Zod schemas
└── infra/            # Docker, Nginx, scripts
```

## Design System

REVO uses a warm, gastronomy-inspired palette:

- **Arcilla** `#C1694F` — Primary (warm terracotta)
- **Salvia** `#6B8F71` — Secondary (sage green)
- **Miel** `#D4A843` — Accent (honey gold)
- **Oliva** `#2C3A2E` — Dark backgrounds

Typography: Archivo (headings) · Plus Jakarta Sans (UI) · Outfit (body) · Cormorant Garamond (accent)

---

Built with ❤️ for Venezuelan restaurateurs.
