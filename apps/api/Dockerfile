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

# Install pnpm (needed for module resolution)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy ENTIRE app from builder (preserves pnpm symlinks)
COPY --from=builder /app ./

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Stay in root, run from apps/api path
WORKDIR /app

EXPOSE 3000

# Run from monorepo root with full path
CMD ["node", "apps/api/dist/main.js"]