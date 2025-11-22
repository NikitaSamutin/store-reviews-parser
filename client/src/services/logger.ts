export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEvent =
  | 'boot'
  | 'ui.event'
  | 'request'
  | 'response'
  | 'error'
  | 'routing'
  | 'search'
  | 'parse'
  | 'reviews.load'
  | 'export';

export type LogEntry = {
  id: string;
  ts: string;
  level: LogLevel;
  event: LogEvent;
  reqId?: string;
  tags?: string[];
  data?: Record<string, any>;
};

class Logger {
  private buffer: LogEntry[] = [];
  private max = 500;
  private listeners: Set<() => void> = new Set();
  private debug = false;

  setDebug(v: boolean) {
    this.debug = v;
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('DEBUG_LOGS', v ? '1' : '0'); } catch {}
    }
  }

  getDebug() {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('DEBUG_LOGS') === '1' || this.debug; } catch { return this.debug; }
    }
    return this.debug;
  }

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }

  clear() {
    this.buffer = [];
    this.emit();
  }

  getAll() {
    return this.buffer.slice();
  }

  private emit() {
    for (const cb of this.listeners) cb();
  }

  private push(entry: LogEntry) {
    this.buffer.push(entry);
    if (this.buffer.length > this.max) this.buffer.shift();
    this.emit();
  }

  log(level: LogLevel, event: LogEvent, data?: Record<string, any>) {
    const entry: LogEntry = {
      id: this.uuid(),
      ts: new Date().toISOString(),
      level,
      event,
      reqId: data && typeof data.reqId === 'string' ? data.reqId : undefined,
      tags: data && Array.isArray(data.tags) ? data.tags as string[] : undefined,
      data,
    };
    this.push(entry);
  }

  uuid() {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export const logger = new Logger();
