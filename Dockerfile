# Simplified Dockerfile для API без workspaces
FROM node:20-alpine

WORKDIR /app

# Копируем весь контекст, чтобы работать как из корня репо, так и из packages/api
COPY . .

# Определяем директорию приложения: если есть packages/api — используем её, иначе корень
RUN set -eux; \
    if [ -f packages/api/package.json ]; then \
      ln -s /app/packages/api /app/service; \
    else \
      ln -s /app /app/service; \
    fi; \
    cd /app/service; \
    npm ci; \
    npm run build; \
    npm prune --production

# Порт из переменной окружения  
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Работаем из директории сервиса
WORKDIR /app/service

# Запуск
CMD ["node", "dist/index.js"]
