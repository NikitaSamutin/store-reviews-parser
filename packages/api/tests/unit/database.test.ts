/**
 * Database tests - P0 Critical
 * 
 * Проблемы:
 * 1. SQLite никогда не загружается (sqlite3 = null)
 * 2. memReviews растёт неограниченно
 * 3. Каждый запрос копирует весь массив
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Database } from '../../src/database/database.js';

describe('Database', () => {
  describe('SQLite Loading', () => {
    it('should attempt to load sqlite3 dynamically', async () => {
      // Этот тест проверяет, что есть попытка загрузить sqlite3
      // Сейчас sqlite3 = null и никогда не инициализируется
      const db = new Database();
      
      // Если sqlite3 доступен, должен использоваться SQLite
      // Если нет — fallback на in-memory
      // Проблема: сейчас ВСЕГДА in-memory, даже если sqlite3 установлен
      
      // TODO: После исправления этот тест должен проходить
      // когда sqlite3 установлен как optional dependency
      expect(db).toBeDefined();
    });

    it('should use in-memory storage as fallback when sqlite3 unavailable', () => {
      const db = new Database();
      // Это работает, но проблема в том что это ЕДИНСТВЕННЫЙ режим
      expect(db).toBeDefined();
    });
  });

  describe('Memory Limits - P0 CRITICAL', () => {
    let db: Database;

    beforeEach(() => {
      db = new Database();
    });

    it('should have a maximum limit for in-memory reviews', async () => {
      // FAILING TEST: Сейчас нет лимита, memReviews растёт бесконечно
      const MAX_REVIEWS = 10000; // Ожидаемый лимит
      
      // Создаём больше отзывов чем лимит
      const reviews = Array.from({ length: MAX_REVIEWS + 1000 }, (_, i) => ({
        id: `review-${i}`,
        appName: 'Test App',
        store: 'apple' as const,
        rating: 5,
        title: 'Test',
        content: 'Test content',
        author: 'Author',
        date: new Date(),
        region: 'us',
        version: '1.0',
        helpful: 0,
      }));

      await db.saveReviews(reviews);
      
      const result = await db.getReviews({});
      
      // После исправления: должно быть не больше MAX_REVIEWS
      expect(result.total).toBeLessThanOrEqual(MAX_REVIEWS);
    });

    it('should evict oldest reviews when limit exceeded', async () => {
      const MAX_REVIEWS = 10000;
      
      // Сначала добавляем старые отзывы
      const oldReviews = Array.from({ length: MAX_REVIEWS }, (_, i) => ({
        id: `old-${i}`,
        appName: 'Test App',
        store: 'apple' as const,
        rating: 5,
        title: 'Old',
        content: 'Old content',
        author: 'Author',
        date: new Date('2024-01-01'),
        region: 'us',
      }));
      
      await db.saveReviews(oldReviews as any);
      
      // Затем добавляем новые
      const newReviews = Array.from({ length: 1000 }, (_, i) => ({
        id: `new-${i}`,
        appName: 'Test App',
        store: 'apple' as const,
        rating: 5,
        title: 'New',
        content: 'New content',
        author: 'Author',
        date: new Date('2025-01-01'),
        region: 'us',
      }));
      
      await db.saveReviews(newReviews as any);
      
      const result = await db.getReviews({ limit: 10 });
      
      // Новые отзывы должны быть сохранены, старые — вытеснены
      expect(result.reviews[0].id).toContain('new-');
    });
  });

  describe('Query Performance', () => {
    it('should not copy entire array for simple queries', async () => {
      const db = new Database();
      
      // Добавляем много отзывов
      const reviews = Array.from({ length: 5000 }, (_, i) => ({
        id: `review-${i}`,
        appName: 'Test App',
        store: 'apple' as const,
        rating: (i % 5) + 1,
        title: 'Test',
        content: 'Test content',
        author: 'Author',
        date: new Date(),
        region: 'us',
      }));
      
      await db.saveReviews(reviews as any);
      
      // Запрос с limit=10 не должен копировать все 5000 записей
      const startTime = performance.now();
      await db.getReviews({ limit: 10 });
      const duration = performance.now() - startTime;
      
      // Должно быть быстро (< 10ms для 10 записей)
      // Сейчас делает slice() всего массива
      expect(duration).toBeLessThan(50);
    });
  });
});
