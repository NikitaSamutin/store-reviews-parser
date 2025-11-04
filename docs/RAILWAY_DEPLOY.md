# Деплой на Railway.app

## Преимущества Railway
- ✅ **Простой деплой** — без yaml конфигов
- ✅ **Нет таймаутов** — парсинг любой длины
- ✅ **$5 бесплатно** — достаточно на месяц тестирования
- ✅ **Автоматический SSL** и домены
- ✅ **Не засыпает** — сервер всегда активен

## Быстрый старт

### 1. Создайте проект на Railway

1. Откройте https://railway.app/
2. Нажмите **"Start a New Project"**
3. Выберите **"Deploy from GitHub repo"**
4. Выберите репозиторий: `NikitaSamutin/store-reviews-parser`

### 2. Настройте API сервис

1. Railway автоматически определит Node.js проект
2. Перейдите в **Settings** → **Environment**
3. Добавьте переменные:
   ```
   NODE_ENV=production
   PORT=3000
   ```

4. В **Settings** → **Networking**:
   - Нажмите **"Generate Domain"** — Railway создаст публичный URL

5. В **Settings** → **Deploy**:
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: оставьте пустым (корень проекта)

### 3. Дождитесь деплоя

Railway автоматически соберёт и задеплоит API (~3-5 минут).

После успешного деплоя скопируйте URL (например: `https://store-reviews-api.up.railway.app`)

### 4. Обновите фронтенд на Netlify

1. Откройте настройки Netlify проекта
2. Перейдите в **Site settings** → **Environment variables**
3. Измените `VITE_API_URL`:
   ```
   VITE_API_URL=https://ваш-домен.up.railway.app/api
   ```
   ⚠️ **Важно**: замените на ваш Railway URL + `/api`

4. **Redeploy** фронтенд на Netlify

### 5. Готово! 🎉

Откройте ваш сайт на Netlify и попробуйте спарсить Telegram!

## Стоимость

Railway использует **pay-as-you-go**:
- **$5 trial credit** для новых пользователей (без карты)
- После использования $5 → **$5/месяц** минимум
- Расход: ~$0.10-0.30/день для легкой нагрузки

**Итого**: ~$5/месяц для постоянной работы

## Мониторинг использования

Отслеживайте расход в Railway Dashboard → **Usage**

Когда trial $5 закончится, Railway попросит добавить карту для продолжения.

## Альтернатива: только API на Railway

Если Railway дорого:
- **API** на Railway ($5/мес)
- **Frontend** на Netlify (бесплатно)
- **База данных** в памяти или добавить Supabase (бесплатно)

## Troubleshooting

### Проблема: деплой падает
Проверьте логи в Railway → **Deployments** → кликните на деплой → **View Logs**

### Проблема: порт не работает
Railway автоматически определяет PORT. Убедитесь, что в коде используется `process.env.PORT`

### Проблема: фронтенд не подключается к API
- Проверьте CORS в `app.ts`
- Убедитесь, что `VITE_API_URL` правильный
- Проверьте, что API отвечает: `curl https://ваш-домен.up.railway.app/api/health`

## Что дальше?

После успешного деплоя:
1. ✅ Протестируйте парсинг
2. ✅ Проверьте keep-alive работает
3. ✅ Настройте алерты в Railway (опционально)
