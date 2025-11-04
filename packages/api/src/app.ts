// Назначение файла: конфигурация Express-приложения (middleware, маршруты, обработчики ошибок). Без записи экспортов на диск.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes/api';

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
// CORS: в проде разрешаем все источники по умолчанию ('*'), либо список из ALLOWED_ORIGINS
app.use(cors({
  origin: (() => {
    if (process.env.NODE_ENV === 'production') {
      if (process.env.ALLOWED_ORIGINS) {
        return process.env.ALLOWED_ORIGINS.split(',');
      }
      return '*';
    }
    return ['http://localhost:3001'];
  })(),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Создаём необходимые директории
// На Netlify функции файловая система только для записи в /tmp
// AWS_LAMBDA_FUNCTION_NAME присутствует только в Netlify Functions runtime
const isNetlify = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const baseWritableDir = isNetlify ? '/tmp' : path.join(__dirname, '..');
const dataDir = path.join(baseWritableDir, 'data');

// В serverless окружении создаём директорию только если её нет
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    // Игнорируем ошибки создания директории в read-only FS
    console.warn('Could not create data directory:', err);
  }
}

// Директория exports больше не нужна — экспорт отдаётся напрямую в ответе

// API Routes
// Если приложение запущено в окружении Netlify, API-маршруты доступны в корне.
// В локальной среде и на Render они доступны по префиксу /api.
// Это необходимо для корректной работы прокси в Vite.
const basePath = isNetlify ? '/.netlify/functions/api' : '/api';
app.use(basePath, apiRoutes);

// Health check
app.get(`${basePath}/health`, (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.2',
    runtime: isNetlify ? 'netlify-functions' : process.env.RENDER ? 'render' : 'local'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Внутренняя ошибка сервера'
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден'
  });
});

export default app;
