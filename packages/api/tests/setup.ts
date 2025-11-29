// Global test setup
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Force in-memory mode for tests (don't load sqlite3)
process.env.FORCE_IN_MEMORY = '1';

// Suppress console output during tests unless DEBUG is set
if (!process.env.DEBUG) {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });
}

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
