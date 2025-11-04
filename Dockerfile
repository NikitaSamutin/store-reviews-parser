# Multi-stage build для API сервиса
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/

# Устанавливаем зависимости - используем npm install с явным кэшем
RUN npm install --legacy-peer-deps --cache /tmp/.npm

# Копируем исходники
COPY . .

# Собираем API
RUN npm run build:api

# Production stage
FROM node:20-alpine

WORKDIR /app

# Копируем только необходимое для production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/api/package*.json ./packages/api/
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/node_modules ./packages/api/node_modules

# Порт из переменной окружения
ENV PORT=3000
EXPOSE 3000

# Запуск
CMD ["npm", "start"]
