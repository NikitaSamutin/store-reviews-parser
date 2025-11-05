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
app.use((req, res, next) => {
    const start = Date.now();
    const reqId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-Id', reqId);
    req.reqId = reqId;
    const netlify = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const bp = netlify ? '/.netlify/functions/api' : '/api';
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
    const originalEnd = res.end;
    res.end = function (...args) {
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
        }
        catch { }
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
    }
    catch (err) {
        // Игнорируем ошибки создания директории в read-only FS
        console.warn('Could not create data directory:', err);
    }
}
// Директория exports больше не нужна — экспорт отдаётся напрямую в ответе
// В Netlify Functions serverless-http уже обрезает путь к функции,
// поэтому Express получает только /health вместо /.netlify/functions/api/health
// В локальной среде используем префикс /api
// В Netlify Functions serverless-http НЕ обрезает путь функции
// Express получает ПОЛНЫЙ путь включая /.netlify/functions/api
const basePath = isNetlify ? '/.netlify/functions/api' : '/api';
// Health check
app.get(`${basePath}/health`, (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.8',
        runtime: isNetlify ? 'netlify-functions' : 'local'
    });
});
// API Routes
app.use(basePath, apiRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
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
//# sourceMappingURL=app.js.map