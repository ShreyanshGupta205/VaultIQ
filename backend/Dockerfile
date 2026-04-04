# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl openssl-dev

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl for Prisma runtime
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=10000

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built app and prisma files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 10000

CMD ["node", "dist/server.js"]
