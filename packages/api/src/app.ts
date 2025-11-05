// Назначение файла: конфигурация Express-приложения (middleware, маршруты, обработчики ошибок). Без записи экспортов на диск.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import apiRoutes from './routes/api.js';

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

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  const reqId = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('X-Request-Id', reqId);
  (req as any).reqId = reqId;
  const netlify = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  const bp = netlify ? '/' : '/api';
  res.setHeader('X-Base-Path', bp);
  const runtime = netlify ? 'netlify-functions' : 'local';
  res.setHeader('X-Runtime', runtime);
  
  // Всегда логируем в Netlify для отладки
  if (netlify) {
    console.log('Netlify request:', {
      reqId,
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path,
      headers: req.headers
    });
  }
  
  const debug = (process.env.DEBUG === '1' || process.env.DEBUG === 'true' || req.headers['x-debug'] === '1');
  if (debug) {
    console.log('Request start', {
      reqId,
      method: req.method,
      url: req.originalUrl,
      query: req.query
    });
  }
  const originalEnd = (res as any).end;
  (res as any).end = function(...args: any[]) {
    try {
      const durationMs = Date.now() - start;
      res.setHeader('X-Response-Time', `${durationMs}ms`);
      if (debug) {
        console.log('Request end', {
          reqId,
          status: res.statusCode,
          durationMs
        });
      }
    } catch {}
    return originalEnd.apply(this, args);
  };
  next();
});

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

// В Netlify Functions serverless-http уже обрезает путь к функции,
// поэтому Express получает только /health вместо /.netlify/functions/api/health
// В локальной среде используем префикс /api

// Debug endpoint - показывает что именно получает Express
app.all('*', (req, res, next) => {
  if (req.path === '/debug-request' || req.path === '/.netlify/functions/api/debug-request') {
    return res.json({
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      method: req.method,
      headers: req.headers,
      query: req.query,
      isNetlify,
      env: {
        NETLIFY: process.env.NETLIFY,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME
      }
    });
  }
  next();
});

if (isNetlify) {
  // В Netlify монтируем напрямую без префикса
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.7',
      runtime: 'netlify-functions'
    });
  });
  app.use('/', apiRoutes);
} else {
  // В локальной среде используем /api префикс
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.7',
      runtime: 'local'
    });
  });
  app.use('/api', apiRoutes);
}

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
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден'
  });
});

export default app;
