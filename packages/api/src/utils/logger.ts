/**
 * Структурированный логгер
 * 
 * Выводит логи в JSON-формате для production и читаемом формате для development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  reqId?: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Минимальный уровень логирования (из env или info по умолчанию)
const MIN_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Список заголовков, которые безопасно логировать
const SAFE_HEADERS = [
  'content-type',
  'content-length',
  'user-agent',
  'accept',
  'accept-language',
  'x-request-id',
  'x-forwarded-for',
];

/**
 * Фильтрует заголовки, оставляя только безопасные
 */
export const filterHeaders = (headers: Record<string, unknown>): Record<string, unknown> => {
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(headers)) {
    if (SAFE_HEADERS.includes(key.toLowerCase())) {
      filtered[key] = headers[key];
    }
  }
  return filtered;
};

/**
 * Редактирует sensitive данные в объекте
 */
export const sanitizeData = (data: unknown): unknown => {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    // Не логируем длинные строки полностью
    if (data.length > 500) {
      return data.substring(0, 500) + '...[truncated]';
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    // Ограничиваем размер массивов в логах
    if (data.length > 10) {
      return [...data.slice(0, 10), `...[${data.length - 10} more items]`];
    }
    return data.map(sanitizeData);
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Скрываем sensitive поля
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('key')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Форматирует лог для вывода
 */
const formatLog = (entry: LogEntry): string => {
  if (IS_PRODUCTION) {
    // JSON для production (легко парсить в log aggregators)
    return JSON.stringify(entry);
  }
  
  // Читаемый формат для development
  const { timestamp, level, message, reqId, data } = entry;
  const prefix = `[${timestamp}] ${level.toUpperCase().padEnd(5)}`;
  const reqIdStr = reqId ? ` [${reqId.substring(0, 8)}]` : '';
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  
  return `${prefix}${reqIdStr} ${message}${dataStr}`;
};

/**
 * Основная функция логирования
 */
const log = (level: LogLevel, message: string, data?: Record<string, unknown>, reqId?: string): void => {
  // Проверяем уровень логирования
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) {
    return;
  }
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(reqId && { reqId }),
    ...(data && { data: sanitizeData(data) as Record<string, unknown> }),
  };
  
  const formatted = formatLog(entry);
  
  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
};

/**
 * Экспортируемый логгер
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>, reqId?: string) => log('debug', message, data, reqId),
  info: (message: string, data?: Record<string, unknown>, reqId?: string) => log('info', message, data, reqId),
  warn: (message: string, data?: Record<string, unknown>, reqId?: string) => log('warn', message, data, reqId),
  error: (message: string, data?: Record<string, unknown>, reqId?: string) => log('error', message, data, reqId),
  
  // Хелпер для логирования ошибок с stack trace
  logError: (message: string, error: unknown, reqId?: string) => {
    const errorData: Record<string, unknown> = {};
    
    if (error instanceof Error) {
      errorData.name = error.name;
      errorData.message = error.message;
      // Stack trace только в development
      if (!IS_PRODUCTION) {
        errorData.stack = error.stack;
      }
    } else {
      errorData.error = String(error);
    }
    
    log('error', message, errorData, reqId);
  },
};

export default logger;
