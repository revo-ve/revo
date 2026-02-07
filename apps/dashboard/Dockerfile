# ============================================
# REVO — Dashboard Dockerfile
# ============================================
# Location: apps/dashboard/Dockerfile
# ============================================

# ─── Build Stage ───
FROM node:20-alpine AS builder

WORKDIR /app

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY apps/dashboard/ ./apps/dashboard/
COPY turbo.json ./

# Build the dashboard
RUN pnpm --filter @revo/dashboard build

# ─── Production Stage ───
FROM nginx:alpine AS runner

# Copy built files
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]