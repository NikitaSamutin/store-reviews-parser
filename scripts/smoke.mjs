import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const BASE_URL = process.env.PROD_BASE_URL || process.env.BASE_URL;
if (!BASE_URL) {
  console.error('Missing PROD_BASE_URL/BASE_URL env');
  process.exit(2);
}

const withTimeout = async (promise, ms, msg) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await promise(controller.signal);
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw new Error(msg + ': ' + (e?.message || String(e)));
  }
};

const fetchJson = async (path, signal) => {
  const res = await fetch(`${BASE_URL}${path}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(`Invalid content-type: ${ct}`);
  return res.json();
};

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

async function waitForHealthy(maxAttempts = 20, intervalMs = 15000) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const health = await withTimeout((signal) => fetchJson('/api/health', signal), 12000, 'Health check failed');
      if (health && health.status === 'OK') return true;
      lastErr = new Error('Health not OK');
    } catch (e) {
      lastErr = e;
    }
    const left = maxAttempts - attempt;
    console.log(`Health not ready (attempt ${attempt}), retrying in ${intervalMs}ms... (${left} left)`);
    await delay(intervalMs);
  }
  throw lastErr || new Error('Health never became OK');
}

(async () => {
  try {
    // Wait until deploy is healthy (tolerate Netlify deploy latency)
    await waitForHealthy();

    // Search via App Store (стабильнее для smoke)
    const search = await withTimeout((signal) => fetchJson('/api/search?query=telegram&region=us&store=apple', signal), 25000, 'Search failed');
    assert(search && search.success === true, 'Search success flag is false');
    assert(Array.isArray(search.data) && search.data.length > 0, 'Search returned empty data');

    // API 404 inside function scope
    const notFoundRes = await withTimeout(async (signal) => {
      const r = await fetch(`${BASE_URL}/api/__unknown__`, { signal });
      assert(r.status === 404, `Expected 404, got ${r.status}`);
      return r;
    }, 10000, '404 route check failed');

    console.log('SMOKE OK');
    process.exit(0);
  } catch (e) {
    console.error('SMOKE FAIL:', e.message || e);
    // маленькая задержка, чтобы логи успели записаться в CI
    await delay(250);
    process.exit(1);
  }
})();
