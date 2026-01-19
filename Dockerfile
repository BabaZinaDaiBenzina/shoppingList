FROM node:20-alpine

  # Accept build arguments
  ARG JWT_SECRET
  ENV JWT_SECRET=${JWT_SECRET}

  RUN apk add --no-cache python3 make g++ postgresql-client

  WORKDIR /app

  COPY package.json package-lock.json* ./
  RUN npm ci

  COPY . .
  RUN npx prisma generate
  RUN npm run build

  EXPOSE 3000

  ENV PORT=3000
  ENV NODE_ENV=production
  ENV HOSTNAME="0.0.0.0"

  CMD ["npm", "start"]
