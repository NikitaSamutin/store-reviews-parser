/**
 * Health endpoint tests
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/health', () => {
  it('should return 200 with status OK', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  it('should include version', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body.version).toBeDefined();
    expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should include runtime', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body.runtime).toBe('node');
  });

  it('should include timestamp', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
  });

  it('should include X-Request-Id header', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('should include X-Response-Time header', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-response-time']).toBeDefined();
    expect(response.headers['x-response-time']).toMatch(/^\d+ms$/);
  });
});
