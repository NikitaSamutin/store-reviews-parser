"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewService_1 = require("../services/reviewService");
const exportService_1 = require("../services/exportService");
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
const reviewService = new reviewService_1.ReviewService();
const exportService = new exportService_1.ExportService();
// Поиск приложений
router.get('/search', async (req, res) => {
    try {
        const { query, region, store } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Параметр query обязателен'
            });
        }
        const apps = await reviewService.searchApps(query, region || 'us', store);
        res.json({
            success: true,
            data: apps
        });
    }
    catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});
// Парсинг отзывов
router.post('/parse', async (req, res) => {
    try {
        const { appId, store, appName, region } = req.body;
        if (!appId || !store) {
            return res.status(400).json({
                success: false,
                error: 'Параметры appId и store обязательны'
            });
        }
        if (!['google', 'apple'].includes(store)) {
            return res.status(400).json({
                success: false,
                error: 'Параметр store должен быть "google" или "apple"'
            });
        }
        const reviews = await reviewService.parseAndSaveReviews({
            appId,
            store,
            appName,
            region,
        });
        res.json({
            success: true,
            data: reviews,
            total: reviews.length
        });
    }
    catch (error) {
        console.error('Ошибка парсинга:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при парсинге отзывов'
        });
    }
});
// Получение отзывов с фильтрами
router.get('/reviews', async (req, res) => {
    try {
        const { appName, appId, store, ratings, region, startDate, endDate, limit, offset } = req.query;
        const filters = {
            store: store,
            region: region,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
            appId: appId || undefined
        };
        // Обработка рейтингов (множественный выбор)
        if (ratings) {
            if (typeof ratings === 'string') {
                filters.ratings = ratings.split(',').map(r => parseInt(r)).filter(r => !isNaN(r));
            }
            else if (Array.isArray(ratings)) {
                filters.ratings = ratings.map(r => parseInt(r)).filter(r => !isNaN(r));
            }
        }
        // Обработка дат
        if (startDate) {
            filters.startDate = new Date(startDate);
        }
        if (endDate) {
            filters.endDate = new Date(endDate);
        }
        // appName больше не используется для серверной фильтрации; используется appId + store + region
        const result = await reviewService.getReviews(filters);
        res.json({
            success: true,
            data: result.reviews,
            total: result.total
        });
    }
    catch (error) {
        console.error('Ошибка получения отзывов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении отзывов'
        });
    }
});
// Экспорт отзывов
router.post('/export', async (req, res) => {
    try {
        const { appName, appId, store, ratings, region, startDate, endDate, format = 'csv', total } = req.body;
        const filters = {
            store,
            region,
            limit: total ? Number(total) : undefined, // Используем total как limit
            offset: 0, // Экспорт всегда с начала
            appId
        };
        if (ratings && Array.isArray(ratings)) {
            filters.ratings = ratings;
        }
        if (startDate) {
            filters.startDate = new Date(startDate);
        }
        if (endDate) {
            filters.endDate = new Date(endDate);
        }
        // Для экспорта используем ключи appId/store/region
        const result = await reviewService.getReviews(filters);
        if (result.reviews.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Отзывы не найдены для экспорта'
            });
        }
        let filePath;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `reviews_${appName || 'all'}_${timestamp}`;
        if (format === 'json') {
            filePath = await exportService.exportToJSON(result.reviews, `${filename}.json`);
        }
        else {
            filePath = await exportService.exportToCSV(result.reviews, `${filename}.csv`);
        }
        res.json({
            success: true,
            data: {
                filename: path_1.default.basename(filePath),
                path: filePath,
                count: result.reviews.length
            }
        });
    }
    catch (error) {
        console.error('Ошибка экспорта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при экспорте отзывов'
        });
    }
});
// Скачивание экспортированного файла
router.get('/download/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const isNetlify = !!process.env.NETLIFY;
        const baseDir = isNetlify ? '/tmp' : path_1.default.join(__dirname, '..', '..');
        const filePath = path_1.default.join(baseDir, 'exports', filename);
        res.download(filePath, (err) => {
            if (err) {
                console.error('Ошибка скачивания файла:', err);
                res.status(404).json({
                    success: false,
                    error: 'Файл не найден'
                });
            }
        });
    }
    catch (error) {
        console.error('Ошибка скачивания:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при скачивании файла'
        });
    }
});
// Получение доступных регионов
router.get('/regions', async (req, res) => {
    try {
        const regions = await reviewService.getAvailableRegions();
        res.json({
            success: true,
            data: regions
        });
    }
    catch (error) {
        console.error('Ошибка получения регионов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении списка регионов'
        });
    }
});
exports.default = router;
//# sourceMappingURL=api.js.map