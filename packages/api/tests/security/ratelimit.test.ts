/**
 * Rate Limiting tests - P0 Critical
 * 
 * Проблема: /parse не имеет rate-limiting и может быть использован для DoS
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Rate Limiting - P0 CRITICAL', () => {
  describe('POST /api/parse', () => {
    it('should have rate limiting enabled', async () => {
      // FAILING TEST: Сейчас нет rate-limiting
      
      // Делаем много запросов подряд
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/parse')
          .send({ appId: 'com.test.app', store: 'google' })
      );

      const responses = await Promise.all(requests);
      
      // После исправления: часть запросов должна получить 429
      const tooManyRequests = responses.filter(r => r.status === 429);
      
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });

    it('should return 429 with Retry-After header when limit exceeded', async () => {
      // FAILING TEST: Сейчас всегда возвращает 200/400/500
      
      // Исчерпываем лимит
      const requests = Array.from({ length: 50 }, () =>
        request(app)
          .post('/api/parse')
          .send({ appId: 'com.test.app', store: 'google' })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.find(r => r.status === 429);
      
      expect(rateLimited).toBeDefined();
      expect(rateLimited?.headers['retry-after']).toBeDefined();
    });

    it('should limit concurrent parsing jobs', async () => {
      // FAILING TEST: Сейчас нет ограничения на параллельные задачи
      
      // Запускаем много параллельных парсингов
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/parse')
          .send({ appId: '686449807', store: 'apple' }) // Telegram
      );

      const responses = await Promise.all(requests);
      
      // Должен быть механизм очереди или отказа
      const accepted = responses.filter(r => r.status === 200 || r.status === 202);
      const rejected = responses.filter(r => r.status === 429 || r.status === 503);
      
      // Не все 10 должны быть приняты одновременно
      expect(rejected.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/export', () => {
    it('should have rate limiting for export endpoint', async () => {
      // FAILING TEST: Сейчас нет rate-limiting
      
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/export')
          .send({ format: 'csv' })
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);
      
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe('General API rate limiting', () => {
    it('should have global rate limit for all endpoints', async () => {
      // Проверяем что есть общий rate-limit
      const endpoints = [
        { method: 'get', path: '/api/health' },
        { method: 'get', path: '/api/search?query=test' },
        { method: 'get', path: '/api/reviews' },
        { method: 'get', path: '/api/regions' },
      ];

      // Делаем много запросов
      const requests: Promise<any>[] = [];
      for (let i = 0; i < 100; i++) {
        const endpoint = endpoints[i % endpoints.length];
        requests.push(
          (request(app) as any)[endpoint.method](endpoint.path)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      // Должен быть хотя бы один 429
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
