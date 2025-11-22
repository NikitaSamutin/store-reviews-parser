// Назначение файла: маршруты API. Экспорт теперь отдаёт файл напрямую (без записи на диск) — удобно для serverless.
import express from 'express';
import { ReviewService } from '../services/reviewService.js';
import { ExportService } from '../services/exportService.js';
const router = express.Router();
const reviewService = new ReviewService();
const exportService = new ExportService();
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
// Экспорт отзывов — отдаём файл напрямую в ответе
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
        // Генерируем имя и формируем содержимое в памяти
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const baseName = `reviews_${appName || 'all'}_${timestamp}`;
        const exportResult = format === 'json'
            ? await exportService.exportToJSON(result.reviews, `${baseName}.json`)
            : await exportService.exportToCSV(result.reviews, `${baseName}.csv`);
        // Для Excel добавляем BOM для CSV, чтобы корректно отображалась кириллица
        const isCsv = exportResult.contentType.startsWith('text/csv');
        const bodyString = isCsv ? '\uFEFF' + exportResult.content : exportResult.content;
        const buffer = Buffer.from(bodyString, 'utf8');
        // Заголовки скачивания файла
        res.setHeader('Content-Type', exportResult.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.setHeader('Content-Length', buffer.length.toString());
        return res.status(200).send(buffer);
    }
    catch (error) {
        console.error('Ошибка экспорта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при экспорте отзывов'
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
export default router;
//# sourceMappingURL=api.js.map