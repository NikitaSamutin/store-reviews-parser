# Simplified Dockerfile для API без workspaces
FROM node:20-alpine

WORKDIR /app

# Копируем package.json для API
COPY packages/api/package*.json ./

# Устанавливаем зависимости API напрямую
RUN npm install --production=false

# Копируем исходники API
COPY packages/api/src ./src
COPY packages/api/tsconfig.json ./

# Собираем TypeScript
RUN npm run build

# Удаляем dev зависимости
RUN npm prune --production

# Порт из переменной окружения  
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Запуск
CMD ["node", "dist/index.js"]
