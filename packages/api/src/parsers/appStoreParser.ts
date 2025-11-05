import axios from 'axios';
import { Review, AppSearchResult } from '../types/index.js';

export class AppStoreParser {
  private baseUrl = 'https://itunes.apple.com';

  async searchApps(query: string, region: string = 'ru'): Promise<AppSearchResult[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          term: query,
          country: region,
          entity: 'software',
          limit: 10
        }
      });

      const apps: AppSearchResult[] = response.data.results.map((app: any) => ({
        id: app.trackId.toString(),
        name: app.trackName,
        developer: app.artistName,
        icon: app.artworkUrl100,
        store: 'apple' as const
      }));

      return apps;
    } catch (error) {
      console.error('Ошибка поиска приложений в App Store:', error);
      return [];
    }
  }

  async parseReviews(appId: string, region?: string): Promise<Review[]> {
    try {
      // 1. Получаем информацию о приложении (один раз)
      const lookupCountry = region || 'us';
      const appResponse = await axios.get(`${this.baseUrl}/lookup`, {
        params: { id: appId, country: lookupCountry },
      });
      const appInfo = appResponse.data.results[0];
      if (!appInfo) throw new Error('Приложение не найдено');
      const appName = appInfo.trackName;

      // 2. Получаем список регионов для парсинга: либо один выбранный, либо набор по умолчанию
      const regions = region ? [region] : await this.getAvailableRegions();
      const allReviewsMap = new Map<string, Review>();

      // 3. Создаем задачи для парсинга каждого региона
      const regionPromises = regions.map(async (region) => {
        const regionalReviews: Review[] = [];
        const pagePromises = [];

        // App Store RSS feed отдает до 10 страниц
        for (let page = 1; page <= 10; page++) {
          const url = `${this.baseUrl}/${region}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`;
          pagePromises.push(axios.get(url).catch(() => null)); // Игнорируем ошибки отдельных запросов
        }

        const responses = await Promise.allSettled(pagePromises);

        for (const response of responses) {
          if (response.status === 'fulfilled' && response.value?.data.feed?.entry) {
            const entries = response.value.data.feed.entry;
            for (let i = 1; i < entries.length; i++) { // Пропускаем первый элемент
              const entry = entries[i];
              try {
                regionalReviews.push({
                  id: entry.id.label,
                  appName,
                  store: 'apple',
                  rating: parseInt(entry['im:rating'].label),
                  title: entry.title.label,
                  content: entry.content.label,
                  author: entry.author.name.label,
                  date: new Date(entry.updated.label),
                  region,
                  version: entry['im:version']?.label,
                  helpful: 0,
                });
              } catch (parseError) {}
            }
          }
        }
        return regionalReviews;
      });

      // 4. Выполняем все задачи параллельно
      const results = await Promise.allSettled(regionPromises);

      // 5. Собираем и дедуплицируем все отзывы
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          result.value.forEach(review => {
            if (!allReviewsMap.has(review.id)) {
              allReviewsMap.set(review.id, review);
            }
          });
        }
      });

      return Array.from(allReviewsMap.values());
    } catch (error) {
      console.error('Ошибка парсинга отзывов App Store:', error);
      return [];
    }
  }

  async getAvailableRegions(): Promise<string[]> {
    // Основные регионы для App Store
    return [
      'ru', 'us', 'gb', 'de', 'fr', 'it', 'es', 'jp', 'kr', 'cn',
      'au', 'ca', 'br', 'mx', 'in', 'tr', 'pl', 'nl', 'se', 'no'
    ];
  }
}
