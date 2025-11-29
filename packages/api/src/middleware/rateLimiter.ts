/**
 * Rate limiting middleware
 * 
 * Защита от DoS и злоупотреблений API
 */

import rateLimit from 'express-rate-limit';

// Глобальный лимит для всех эндпоинтов
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 100, // 100 запросов в минуту
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Слишком много запросов. Попробуйте позже.',
  },
});

// Строгий лимит для /parse (тяжёлая операция)
export const parseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 5, // 5 запросов в минуту
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Слишком много запросов на парсинг. Попробуйте через минуту.',
  },
});

// Лимит для /export
export const exportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // 10 запросов в минуту
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Слишком много запросов на экспорт. Попробуйте через минуту.',
  },
});

// Лимит для /search
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 30, // 30 запросов в минуту
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Слишком много поисковых запросов. Попробуйте позже.',
  },
});
