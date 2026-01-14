# Официальный Node.js образ как базовый
FROM node:20-alpine AS base

# Установка зависимостей для bcrypt
RUN apk add --no-cache python3 make g++

# Рабочая директория
WORKDIR /app

# Копирование файлов зависимостей
COPY package.json package-lock.json* ./

# Установка зависимостей
RUN npm ci --only=production && npm cache clean --force

# Копирование остального кода
COPY . .

# Генерация Prisma Client
RUN npx prisma generate

# Сборка Next.js приложения
RUN npm run build

# Продуктивный образ
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Создание пользователя для безопасности (не root)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Копирование необходимых файлов из предыдущего этапа
COPY --from=base /app/public ./public
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=base --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/package.json ./package.json

# Переключение на пользователя nextjs
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Запуск приложения
CMD ["node", "server.js"]
