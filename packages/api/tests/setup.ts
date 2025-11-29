// Global test setup
import { beforeAll, afterAll, afterEach } from 'vitest';

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
