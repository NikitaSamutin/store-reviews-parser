"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Назначение файла: конфигурация Express-приложения (middleware, маршруты, обработчики ошибок). Без записи экспортов на диск.
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const api_1 = __importDefault(require("./routes/api"));
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
// CORS: в проде разрешаем все источники по умолчанию ('*'), либо список из ALLOWED_ORIGINS
app.use((0, cors_1.default)({
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Создаём необходимые директории
// На Netlify функции файловая система только для записи в /tmp
// AWS_LAMBDA_FUNCTION_NAME присутствует только в Netlify Functions runtime
const isNetlify = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const baseWritableDir = isNetlify ? '/tmp' : path_1.default.join(__dirname, '..');
const dataDir = path_1.default.join(baseWritableDir, 'data');
// В serverless окружении создаём директорию только если её нет
if (!fs_1.default.existsSync(dataDir)) {
    try {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    catch (err) {
        // Игнорируем ошибки создания директории в read-only FS
        console.warn('Could not create data directory:', err);
    }
}
// Директория exports больше не нужна — экспорт отдаётся напрямую в ответе
// API Routes
// Если приложение запущено в окружении Netlify, API-маршруты доступны в корне.
// В локальной среде они доступны по префиксу /api.
// Это необходимо для корректной работы прокси в Vite.
const basePath = isNetlify ? '/.netlify/functions/api' : '/api';
app.use(basePath, api_1.default);
// Health check
app.get(`${basePath}/health`, (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.1',
        runtime: isNetlify ? 'netlify-functions' : 'local'
    });
});
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
exports.default = app;
//# sourceMappingURL=app.js.map