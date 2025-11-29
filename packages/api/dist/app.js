// Назначение файла: конфигурация Express-приложения (middleware, маршруты, обработчики ошибок).
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import apiRoutes from './routes/api.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// Middleware
app.use(helmet());
app.use(compression());
// CORS: в проде разрешаем список из ALLOWED_ORIGINS, иначе localhost для разработки
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
    res.setHeader('X-Base-Path', '/api');
    res.setHeader('X-Runtime', 'node');
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
// Создаём необходимые директории для данных
const baseWritableDir = path.join(__dirname, '..');
const dataDir = path.join(baseWritableDir, 'data');
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    catch (err) {
        console.warn('Could not create data directory:', err);
    }
}
const basePath = '/api';
// Health check
app.get(`${basePath}/health`, (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.9',
        runtime: 'node'
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