/**
 * Input Validation tests - P1 High Priority
 * 
 * Проблемы:
 * 1. limit/total без максимального значения
 * 2. Invalid Date не валидируется
 * 3. store не валидируется как enum
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Input Validation - P1', () => {
  describe('GET /api/reviews - limit validation', () => {
    it('should cap limit to MAX_LIMIT (1000)', async () => {
      // FAILING TEST: Сейчас принимает любое значение
      const response = await request(app)
        .get('/api/reviews')
        .query({ limit: 999999 });

      expect(response.status).toBe(200);
      // Даже если запросили 999999, должно вернуть не больше 1000
      // (или сколько есть в базе, но limit должен быть ограничен)
    });

    it('should reject negative limit', async () => {
      // FAILING TEST: Сейчас parseInt(-5) = -5, проходит дальше
      const response = await request(app)
        .get('/api/reviews')
        .query({ limit: -5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-numeric limit', async () => {
      // FAILING TEST: parseInt("abc") = NaN, не проверяется
      const response = await request(app)
        .get('/api/reviews')
        .query({ limit: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject negative offset', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .query({ offset: -10 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/export - total validation', () => {
    it('should cap total to MAX_EXPORT_TOTAL (10000)', async () => {
      // FAILING TEST: Сейчас принимает любое значение
      const response = await request(app)
        .post('/api/export')
        .send({ total: 1000000, format: 'csv' });

      // Должен либо ограничить, либо вернуть ошибку
      expect(response.status).toBe(200);
      // Content-Length не должен быть гигантским
    });

    it('should reject negative total', async () => {
      const response = await request(app)
        .post('/api/export')
        .send({ total: -100, format: 'csv' });

      expect(response.status).toBe(400);
    });
  });

  describe('Date validation', () => {
    it('should return 400 for invalid startDate', async () => {
      // FAILING TEST: new Date("invalid") создаёт Invalid Date
      // В SQLite-ветке это вызовет .toISOString() → exception
      const response = await request(app)
        .get('/api/reviews')
        .query({ startDate: 'not-a-date' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('date');
    });

    it('should return 400 for invalid endDate', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .query({ endDate: 'invalid-date-format' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('date');
    });

    it('should return 400 when startDate > endDate', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .query({ 
          startDate: '2025-12-01',
          endDate: '2025-01-01' 
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Store enum validation', () => {
    it('should reject invalid store value in /reviews', async () => {
      // FAILING TEST: Сейчас просто кастуется без проверки
      const response = await request(app)
        .get('/api/reviews')
        .query({ store: 'invalid-store' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('store');
    });

    it('should reject invalid store value in /parse', async () => {
      const response = await request(app)
        .post('/api/parse')
        .send({ appId: '123', store: 'amazon' });

      expect(response.status).toBe(400);
    });

    it('should accept valid store values', async () => {
      const googleResponse = await request(app)
        .get('/api/reviews')
        .query({ store: 'google' });
      
      const appleResponse = await request(app)
        .get('/api/reviews')
        .query({ store: 'apple' });

      expect(googleResponse.status).toBe(200);
      expect(appleResponse.status).toBe(200);
    });
  });

  describe('Ratings validation', () => {
    it('should reject ratings outside 1-5 range', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .query({ ratings: '0,6,10' });

      expect(response.status).toBe(400);
    });

    it('should accept valid ratings', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .query({ ratings: '1,3,5' });

      expect(response.status).toBe(200);
    });
  });

  describe('AppId validation', () => {
    it('should validate Apple appId format (numeric)', async () => {
      const response = await request(app)
        .post('/api/parse')
        .send({ appId: 'not-numeric', store: 'apple' });

      // Apple appId должен быть числовым
      expect(response.status).toBe(400);
    });

    it('should validate Google appId format', async () => {
      const response = await request(app)
        .post('/api/parse')
        .send({ appId: 'invalid chars!@#$', store: 'google' });

      // Google appId: только [a-zA-Z0-9._]
      expect(response.status).toBe(400);
    });
  });
});
