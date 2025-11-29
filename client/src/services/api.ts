// Назначение файла: клиентский сервис API (axios). Экспорт теперь получает файл напрямую из /export без отдельной загрузки.
import axios from 'axios';
import { logger } from './logger';
import { 
  ApiResponse, 
  AppSearchResult, 
  Review, 
  ParseRequest, 
  FilterOptions, 
  ExportRequest 
} from '@/types';

// В продакшене используем относительные пути или переменную окружения VITE_API_URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 минут для долгого парсинга
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const reqId = logger.uuid();
  const start = Date.now();
  (config as any).metadata = { reqId, start };
  config.headers = config.headers || {};
  (config.headers as any)['X-Request-Id'] = reqId;
  if (logger.getDebug()) (config.headers as any)['X-Debug'] = '1';
  const data = config.data;
  const payloadSize = data ? (typeof data === 'string' ? data.length : JSON.stringify(data).length) : 0;
  logger.log('debug', 'request', {
    reqId,
    method: (config.method || 'get').toUpperCase(),
    baseURL: config.baseURL,
    url: config.url,
    finalUrl: `${config.baseURL || ''}${config.url || ''}`,
    params: config.params,
    bodyKeys: data && typeof data === 'object' ? Object.keys(data) : undefined,
    payloadSize,
    tags: ['client', 'api']
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    const meta = (response.config as any).metadata || {};
    const durationMs = Date.now() - (meta.start || Date.now());
    const serverReqId = (response.headers['x-request-id'] as any) || undefined;
    logger.log('info', 'response', {
      reqId: meta.reqId,
      status: response.status,
      durationMs,
      serverReqId,
      xResponseTime: response.headers['x-response-time'],
      xRuntime: response.headers['x-runtime'],
      xBasePath: response.headers['x-base-path'],
      contentLength: Number(response.headers['content-length'] || 0),
      tags: ['client', 'api']
    });
    return response;
  },
  (error) => {
    const cfg: any = error.config || {};
    const meta = cfg.metadata || {};
    const durationMs = Date.now() - (meta.start || Date.now());
    const res = error.response;
    let bodySnippet: string | undefined;
    let errorType: string | undefined;
    let errorMessage: string | undefined;
    if (res && typeof res.data === 'string') {
      bodySnippet = res.data.substring(0, 500);
      try {
        const parsed = JSON.parse(res.data);
        errorType = parsed.errorType;
        errorMessage = parsed.errorMessage || parsed.error;
      } catch {}
    } else if (res && typeof res.data === 'object' && res.data) {
      try {
        errorType = res.data.errorType || res.data.type;
        errorMessage = res.data.errorMessage || res.data.error || res.data.message;
        bodySnippet = JSON.stringify(res.data).substring(0, 500);
      } catch {}
    }
    logger.log('error', 'error', {
      reqId: meta.reqId,
      code: error.code,
      message: error.message,
      status: res?.status,
      durationMs,
      serverReqId: res?.headers ? (res.headers['x-request-id'] as any) : undefined,
      xResponseTime: res?.headers ? res.headers['x-response-time'] : undefined,
      bodySnippet,
      errorType,
      errorMessage,
      tags: ['client', 'api']
    });
    return Promise.reject(error);
  }
);

export const apiService = {
  // Поиск приложений
  async searchApps(query: string, region: string = 'us', store?: 'google' | 'apple'): Promise<AppSearchResult[]> {
    try {
      const params: any = { query, region };
      if (store) {
        params.store = store;
      }
      
      const response = await api.get<ApiResponse<AppSearchResult[]>>('/search', {
        params
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Ошибка поиска приложений:', error);
      throw new Error('Не удалось найти приложения');
    }
  },

  // Парсинг отзывов
  async parseReviews(request: ParseRequest): Promise<Review[]> {
    try {
      const response = await api.post<ApiResponse<Review[]>>('/parse', request);
      return response.data.data || [];
    } catch (error) {
      console.error('Ошибка парсинга отзывов:', error);
      throw new Error('Не удалось спарсить отзывы');
    }
  },

  // Получение отзывов с фильтрами
  async getReviews(
    appIdOrName?: string, 
    filters?: FilterOptions
  ): Promise<{ reviews: Review[], total: number }> {
    try {
      const params: any = { ...filters };
      // Prefer appId for key-based retrieval; keep appName for legacy but server ignores it
      if (appIdOrName) {
        params.appId = appIdOrName;
      }

      // Преобразуем массив рейтингов в строку
      if (filters?.ratings && filters.ratings.length > 0) {
        params.ratings = filters.ratings.join(',');
      }

      // Преобразуем даты в ISO строки
      if (filters?.startDate) {
        params.startDate = filters.startDate.toISOString();
      }
      if (filters?.endDate) {
        params.endDate = filters.endDate.toISOString();
      }

      const response = await api.get<ApiResponse<Review[]>>('/reviews', { params });
      
      return {
        reviews: (response.data.data || []).map(review => ({
          ...review,
          date: new Date(review.date)
        })),
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Ошибка получения отзывов:', error);
      throw new Error('Не удалось получить отзывы');
    }
  },

  // Экспорт отзывов — возвращает Blob и имя файла из заголовков ответа
  async exportReviews(request: ExportRequest): Promise<{ blob: Blob; filename: string }> {
    try {
      const payload = {
        ...request,
        startDate: request.startDate?.toISOString(),
        endDate: request.endDate?.toISOString()
      };

      const response = await api.post('/export', payload, {
        responseType: 'blob'
      });

      // Извлекаем имя файла из Content-Disposition
      const disposition = response.headers['content-disposition'] as string | undefined;
      let filename = 'export';
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      return { blob: response.data as Blob, filename };
    } catch (error) {
      console.error('Ошибка экспорта отзывов:', error);
      throw new Error('Не удалось экспортировать отзывы');
    }
  },


  // Получение доступных регионов
  async getRegions(): Promise<string[]> {
    try {
      const response = await api.get<ApiResponse<string[]>>('/regions');
      return response.data.data || [];
    } catch (error) {
      console.error('Ошибка получения регионов:', error);
      return ['ru', 'us', 'gb', 'de', 'fr'];
    }
  },

  // Проверка состояния сервера
  async healthCheck(): Promise<boolean> {
    try {
      await api.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
};

export default apiService;
