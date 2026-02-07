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

# Build the API using nest cli
RUN cd apps/api && npx nest build

# Verify build output
RUN ls -la apps/api/dist/

# ─── Production Stage ───
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy package.json
COPY --from=builder /app/apps/api/package.json ./

# Copy prisma files (for migrations)
COPY --from=builder /app/apps/api/src/database/prisma ./prisma

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist

# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]