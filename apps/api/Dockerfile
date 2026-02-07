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

# Install ALL dependencies
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build the API
RUN cd apps/api && npx nest build

# ─── Production Stage ───
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy entire monorepo structure with node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/src/database/prisma ./apps/api/src/database/prisma
COPY --from=builder /app/packages ./packages

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]