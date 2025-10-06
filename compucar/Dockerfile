# Multi-stage Dockerfile for small, fast Next.js production image

# 1) Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first (better layer caching)
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
# Prefer pnpm if lockfile exists
RUN apk add --no-cache bash && \
    if [ -f pnpm-lock.yaml ]; then \
      npm i -g pnpm@9 && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
      corepack enable && yarn --frozen-lockfile; \
    else \
      npm ci; \
    fi

# Copy the rest
COPY . .

# Build with standalone output
RUN if [ -f pnpm-lock.yaml ]; then pnpm build; \
    elif [ -f yarn.lock ]; then yarn build; \
    else npm run build; fi

# 2) Runner (small)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# If you have prisma schema/migrations needed at runtime, copy them here as needed

EXPOSE 3000
CMD ["node", "server.js"]


