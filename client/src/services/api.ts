// Назначение файла: клиентский сервис API (axios). Экспорт теперь получает файл напрямую из /export без отдельной загрузки.
import axios from 'axios';
import { 
  ApiResponse, 
  AppSearchResult, 
  Review, 
  ParseRequest, 
  FilterOptions, 
  ExportRequest 
} from '@/types';

// В продакшене (сборка на Netlify) используем относительные пути, так как фронтенд и API на одном домене.
// В разработке используем переменную окружения для прокси.
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 минут для долгого парсинга на Render
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерсептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
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
