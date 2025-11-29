// Назначение файла: маршруты API с rate-limiting и валидацией.
import express from 'express';
import { ReviewService } from '../services/reviewService.js';
import { ExportService } from '../services/exportService.js';
import { ApiResponse, FilterOptions } from '../types/index.js';
import { parseLimiter, exportLimiter, searchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const reviewService = new ReviewService();
const exportService = new ExportService();

// Константы валидации
const MAX_LIMIT = 1000;
const MAX_EXPORT_TOTAL = 10000;
const VALID_STORES = ['google', 'apple'];

// Хелпер для валидации числовых параметров
const parsePositiveInt = (value: string | undefined, defaultValue: number, max?: number): number | null => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) return null;
  if (max && parsed > max) return max;
  return parsed;
};

// Хелпер для валидации дат
const parseDate = (value: string | undefined): Date | null | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date;
};

// Поиск приложений
router.get('/search', searchLimiter, async (req, res) => {
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
router.post('/parse', parseLimiter, async (req, res) => {
  try {
    const { appId, store, appName, region } = req.body;
    
    if (!appId || !store) {
      return res.status(400).json({
        success: false,
        error: 'Параметры appId и store обязательны'
      } as ApiResponse<null>);
    }

    if (!VALID_STORES.includes(store)) {
      return res.status(400).json({
        success: false,
        error: 'Параметр store должен быть "google" или "apple"'
      } as ApiResponse<null>);
    }

    // Валидация appId
    if (store === 'apple' && !/^\d+$/.test(appId)) {
      return res.status(400).json({
        success: false,
        error: 'Apple appId должен быть числовым'
      } as ApiResponse<null>);
    }
    if (store === 'google' && !/^[a-zA-Z0-9._]+$/.test(appId)) {
      return res.status(400).json({
        success: false,
        error: 'Google appId содержит недопустимые символы'
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

    // Валидация store
    if (store && !VALID_STORES.includes(store as string)) {
      return res.status(400).json({
        success: false,
        error: 'Параметр store должен быть "google" или "apple"'
      } as ApiResponse<null>);
    }

    // Валидация limit
    const parsedLimit = parsePositiveInt(limit as string | undefined, 50, MAX_LIMIT);
    if (parsedLimit === null) {
      return res.status(400).json({
        success: false,
        error: 'Параметр limit должен быть положительным числом'
      } as ApiResponse<null>);
    }

    // Валидация offset
    const parsedOffset = parsePositiveInt(offset as string | undefined, 0);
    if (parsedOffset === null) {
      return res.status(400).json({
        success: false,
        error: 'Параметр offset должен быть положительным числом'
      } as ApiResponse<null>);
    }

    // Валидация дат
    const parsedStartDate = parseDate(startDate as string | undefined);
    if (parsedStartDate === null) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный формат startDate'
      } as ApiResponse<null>);
    }

    const parsedEndDate = parseDate(endDate as string | undefined);
    if (parsedEndDate === null) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный формат endDate'
      } as ApiResponse<null>);
    }

    // Проверка что startDate <= endDate
    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate не может быть позже endDate'
      } as ApiResponse<null>);
    }

    const filters: FilterOptions = {
      store: store as 'google' | 'apple' | undefined,
      region: region as string | undefined,
      limit: parsedLimit,
      offset: parsedOffset,
      appId: (appId as string | undefined) || undefined,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    };

    // Обработка рейтингов (множественный выбор)
    if (ratings) {
      let parsedRatings: number[] = [];
      if (typeof ratings === 'string') {
        parsedRatings = ratings.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r));
      } else if (Array.isArray(ratings)) {
        parsedRatings = ratings.map(r => parseInt(r as string, 10)).filter(r => !isNaN(r));
      }
      
      // Валидация: рейтинги должны быть от 1 до 5
      const invalidRatings = parsedRatings.filter(r => r < 1 || r > 5);
      if (invalidRatings.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Рейтинги должны быть от 1 до 5'
        } as ApiResponse<null>);
      }
      
      filters.ratings = parsedRatings;
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
router.post('/export', exportLimiter, async (req, res) => {
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

    // Валидация total
    let parsedTotal: number | undefined;
    if (total !== undefined) {
      parsedTotal = Number(total);
      if (isNaN(parsedTotal) || parsedTotal < 0) {
        return res.status(400).json({
          success: false,
          error: 'Параметр total должен быть положительным числом'
        } as ApiResponse<null>);
      }
      if (parsedTotal > MAX_EXPORT_TOTAL) {
        parsedTotal = MAX_EXPORT_TOTAL;
      }
    }

    const filters: FilterOptions = {
      store,
      region,
      limit: parsedTotal, // Используем total как limit
      offset: 0, // Экспорт всегда с начала
      appId
    };

    if (ratings && Array.isArray(ratings)) {
      // Валидация рейтингов
      const invalidRatings = ratings.filter((r: number) => r < 1 || r > 5);
      if (invalidRatings.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Рейтинги должны быть от 1 до 5'
        } as ApiResponse<null>);
      }
      filters.ratings = ratings;
    }

    // Валидация дат
    if (startDate) {
      const parsed = new Date(startDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный формат startDate'
        } as ApiResponse<null>);
      }
      filters.startDate = parsed;
    }
    if (endDate) {
      const parsed = new Date(endDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный формат endDate'
        } as ApiResponse<null>);
      }
      filters.endDate = parsed;
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
