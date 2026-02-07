# ============================================
# REVO — API Dockerfile
# ============================================
# Location: apps/api/Dockerfile
# ============================================

# ─── Build Stage ───
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy ALL project files
COPY . .

# Install dependencies (including devDependencies for build)
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build the API
RUN cd apps/api && npx nest build

# Verify build output
RUN ls -la apps/api/dist/

# ─── Production Stage ───
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy package files for production install
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages ./packages

# Copy prisma files
COPY --from=builder /app/apps/api/src/database/prisma ./apps/api/src/database/prisma

# Install production dependencies only
RUN pnpm install --prod --no-frozen-lockfile

# Generate Prisma client in production
RUN cd apps/api && npx prisma generate

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]