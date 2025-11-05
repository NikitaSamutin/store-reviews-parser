// Назначение файла: маршруты API. Экспорт теперь отдаёт файл напрямую (без записи на диск) — удобно для serverless.
import express from 'express';
import { ReviewService } from '../services/reviewService.js';
import { ExportService } from '../services/exportService.js';
import { ApiResponse, FilterOptions } from '../types/index.js';

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
      } as ApiResponse<null>);
    }

    const apps = await reviewService.searchApps(
      query, 
      region as string || 'us',
      store as 'google' | 'apple' | undefined
    );
    
    res.json({
      success: true,
      data: apps
    } as ApiResponse<typeof apps>);
  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse<null>);
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
      } as ApiResponse<null>);
    }

    if (!['google', 'apple'].includes(store)) {
      return res.status(400).json({
        success: false,
        error: 'Параметр store должен быть "google" или "apple"'
      } as ApiResponse<null>);
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
    } as ApiResponse<typeof reviews>);
  } catch (error) {
    console.error('Ошибка парсинга:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при парсинге отзывов'
    } as ApiResponse<null>);
  }
});

// Получение отзывов с фильтрами
router.get('/reviews', async (req, res) => {
  try {
    const {
      appName,
      appId,
      store,
      ratings,
      region,
      startDate,
      endDate,
      limit,
      offset
    } = req.query;

    const filters: FilterOptions = {
      store: store as 'google' | 'apple' | undefined,
      region: region as string | undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
      appId: (appId as string | undefined) || undefined
    };

    // Обработка рейтингов (множественный выбор)
    if (ratings) {
      if (typeof ratings === 'string') {
        filters.ratings = ratings.split(',').map(r => parseInt(r)).filter(r => !isNaN(r));
      } else if (Array.isArray(ratings)) {
        filters.ratings = ratings.map(r => parseInt(r as string)).filter(r => !isNaN(r));
      }
    }

    // Обработка дат
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    // appName больше не используется для серверной фильтрации; используется appId + store + region
    const result = await reviewService.getReviews(filters);

    res.json({
      success: true,
      data: result.reviews,
      total: result.total
    } as ApiResponse<typeof result.reviews>);
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении отзывов'
    } as ApiResponse<null>);
  }
});

// Экспорт отзывов — отдаём файл напрямую в ответе
router.post('/export', async (req, res) => {
  try {
    const {
      appName,
      appId,
      store,
      ratings,
      region,
      startDate,
      endDate,
      format = 'csv',
      total
    } = req.body;

    const filters: FilterOptions = {
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
      } as ApiResponse<null>);
    }

    // Генерируем имя и формируем содержимое в памяти
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const baseName = `reviews_${appName || 'all'}_${timestamp}`;

    const exportResult =
      format === 'json'
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
  } catch (error) {
    console.error('Ошибка экспорта:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при экспорте отзывов'
    } as ApiResponse<null>);
  }
});


// Получение доступных регионов
router.get('/regions', async (req, res) => {
  try {
    const regions = await reviewService.getAvailableRegions();
    
    res.json({
      success: true,
      data: regions
    } as ApiResponse<typeof regions>);
  } catch (error) {
    console.error('Ошибка получения регионов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении списка регионов'
    } as ApiResponse<null>);
  }
});

export default router;
