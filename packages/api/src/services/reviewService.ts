import { GooglePlayParser } from '../parsers/googlePlayParser.js';
import { AppStoreParser } from '../parsers/appStoreParser.js';
import { Database } from '../database/database.js';
import { Review, AppSearchResult, FilterOptions, ParseOptions } from '../types/index.js';

export class ReviewService {
  private googleParser: GooglePlayParser;
  private appStoreParser: AppStoreParser;
  private database: Database;

  constructor() {
    this.googleParser = new GooglePlayParser();
    this.appStoreParser = new AppStoreParser();
    this.database = new Database();
    
    // Инициализируем парсеры
    this.googleParser.init().catch(console.error);
  }

  async searchApps(query: string, region: string = 'us', store?: 'google' | 'apple'): Promise<AppSearchResult[]> {
    try {
      let googleResults: AppSearchResult[] = [];
      let appleResults: AppSearchResult[] = [];

      if (!store || store === 'google') {
        try {
          googleResults = await this.googleParser.searchApps(query, region);
        } catch (error) {
          console.error('Ошибка поиска в Google Play:', error);
        }
      }

      if (!store || store === 'apple') {
        try {
          appleResults = await this.appStoreParser.searchApps(query, region);
        } catch (error) {
          console.error('Ошибка поиска в App Store:', error);
        }
      }

      // Объединяем и сортируем результаты
      const allResults = [...googleResults, ...appleResults];
      return allResults.slice(0, 10); // Максимум 10 результатов
    } catch (error) {
      console.error('Ошибка поиска приложений:', error);
      return [];
    }
  }

  async parseAndSaveReviews(options: ParseOptions): Promise<Review[]> {
    try {
      let reviews: Review[] = [];

      if (options.store === 'google') {
        reviews = await this.googleParser.parseReviews(options.appId, options.region);
      } else if (options.store === 'apple') {
        reviews = await this.appStoreParser.parseReviews(options.appId, options.region);
      }

      // If a localized appName was provided (e.g., Russian), normalize reviews to use it
      if (options.appName) {
        reviews = reviews.map(r => ({ ...r, appName: options.appName! }));
      }

      // Attach appId to each review for DB keying (not part of Review type formally)
      const reviewsWithAppId = reviews.map(r => ({ ...(r as any), appId: options.appId }));

      if (reviewsWithAppId.length > 0) {
        await this.database.saveReviews(reviewsWithAppId as any);
      }

      return reviewsWithAppId as any as Review[];
    } catch (error) {
      console.error('Ошибка парсинга отзывов:', error);
      throw error;
    }
  }

  async getReviews(filters: FilterOptions): Promise<{ reviews: Review[], total: number }> {
    try {
      return await this.database.getReviews({
        appName: undefined,
        appId: filters.appId,
        store: filters.store,
        ratings: filters.ratings,
        region: filters.region,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: filters.limit,
        offset: filters.offset
      });
    } catch (error) {
      console.error('Ошибка получения отзывов:', error);
      throw error;
    }
  }

  async getFilteredReviews(appName: string, filters: FilterOptions): Promise<{ reviews: Review[], total: number }> {
    try {
      return await this.database.getReviews({
        appName,
        store: filters.store,
        ratings: filters.ratings,
        region: filters.region,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: filters.limit,
        offset: filters.offset
      });
    } catch (error) {
      console.error('Ошибка получения отфильтрованных отзывов:', error);
      throw error;
    }
  }

  async getAvailableRegions(): Promise<string[]> {
    return await this.appStoreParser.getAvailableRegions();
  }

  async close(): Promise<void> {
    await this.googleParser.close();
    this.database.close();
  }
}
