# Builder stage
FROM node:20-alpine AS builder

# Accept build arguments
ARG JWT_SECRET
ENV JWT_SECRET=${JWT_SECRET}

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files properly for standalone (CLI + Client + Schema)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

# Create node_modules/.bin directory and add prisma symlink
RUN mkdir -p ./node_modules/.bin && \
    ln -sf ../prisma/build/index.js ./node_modules/.bin/prisma && \
    chmod +x ./node_modules/prisma/build/index.js

# Copy package files for version tracking
COPY --from=builder /app/package.json ./package.json

# Add node_modules/.bin to PATH
ENV PATH="./node_modules/.bin:${PATH}"

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
