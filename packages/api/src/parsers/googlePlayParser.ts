import { Review, AppSearchResult } from '../types/index.js';

export class GooglePlayParser {
  private gplay: any = null;

  private regionToLang(region?: string): string {
    if (!region) return 'en';
    const map: Record<string, string> = {
      ru: 'ru',
      us: 'en',
      gb: 'en',
      de: 'de',
      fr: 'fr',
      it: 'it',
      es: 'es',
      jp: 'ja',
      kr: 'ko',
      cn: 'zh-cn',
      au: 'en',
      ca: 'en',
      br: 'pt-br',
      mx: 'es',
      in: 'en',
      tr: 'tr',
      pl: 'pl',
      nl: 'nl',
      se: 'sv',
      no: 'no',
    };
    return map[region] || 'en';
  }
  async init(): Promise<void> {
    if (!this.gplay) {
      this.gplay = await import('google-play-scraper');
    }
  }

  async searchApps(query: string, region: string = 'us'): Promise<AppSearchResult[]> {
    await this.init();
    try {
      const results = await this.gplay.default.search({
        term: query,
        num: 10,
        country: region,
        lang: this.regionToLang(region),
      });

      return results.map((app: any) => ({
        id: app.appId,
        name: app.title,
        developer: app.developer,
        icon: app.icon,
        store: 'google' as const,
      }));
    } catch (error) {
      console.error('Ошибка поиска приложений в Google Play:', error);
      return [];
    }
  }

  async parseReviews(appId: string, region?: string): Promise<Review[]> {
    await this.init();
    try {
      const app = await this.gplay.default.app({ appId, country: region, lang: this.regionToLang(region) });
      const appName = app.title;

      const regions = region ? [region] : this.getAvailableRegions();
      const allReviewsMap = new Map<string, Review>();

      // Функция для получения отзывов с пагинацией
      const getReviewsWithPagination = async (region: string, maxReviews: number = 1000) => {
        const reviews: any[] = [];
        let nextToken: string | undefined;
        let currentPage = 0;
        const maxPages = 10; // Ограничиваем количество страниц для избежания бесконечного цикла

        try {
          do {
            const response = await this.gplay.default.reviews({
              appId: appId,
              country: region,
              lang: this.regionToLang(region),
              sort: this.gplay.default.sort.NEWEST,
              num: 200, // Максимум за один запрос
              paginate: true,
              nextPaginationToken: nextToken,
            });

            if (response.data && response.data.length > 0) {
              reviews.push(...response.data);
              nextToken = response.nextPaginationToken;
              currentPage++;
              
              // Добавляем небольшую задержку между запросами
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              break;
            }
          } while (nextToken && reviews.length < maxReviews && currentPage < maxPages);

          return reviews;
        } catch (error) {
          console.log(`Не удалось получить отзывы для региона ${region}:`, error instanceof Error ? error.message : String(error));
          return [];
        }
      };

      // Получаем отзывы из основных регионов с пагинацией
      const primaryRegions = ['us', 'ru', 'gb', 'de', 'fr']; // Ограничиваем основными регионами для производительности
      
      for (const region of primaryRegions) {
        console.log(`Получаем отзывы для региона ${region}...`);
        const regionReviews = await getReviewsWithPagination(region, 1000);
        
        regionReviews.forEach((review: any) => {
          // Пропускаем отзывы с пустым содержимым или некорректными данными
          if (!review.text || !review.text.trim() || !review.id || !review.userName) {
            return;
          }

          const reviewData = {
            id: review.id,
            appName,
            store: 'google' as const,
            rating: review.score || 0,
            title: review.title || '',
            content: review.text.trim(),
            author: review.userName,
            date: new Date(review.date),
            region: region,
            version: review.version || '',
            helpful: review.replyContent ? 1 : 0,
          };
          
          if (!allReviewsMap.has(review.id)) {
            allReviewsMap.set(review.id, reviewData);
          }
        });
        
        console.log(`Получено ${regionReviews.length} отзывов для региона ${region}, всего уникальных: ${allReviewsMap.size}`);
      }

      const finalReviews = Array.from(allReviewsMap.values());
      console.log(`Google Play парсер: получено ${finalReviews.length} уникальных отзывов для ${appName}`);
      
      return finalReviews;
    } catch (error) {
      console.error(`Ошибка парсинга отзывов Google Play для ${appId}:`, error);
      return [];
    }
  }

  getAvailableRegions(): string[] {
    // Основные регионы для Google Play
    return [
      'ru', 'us', 'gb', 'de', 'fr', 'it', 'es', 'jp', 'kr',
      'au', 'ca', 'br', 'mx', 'in', 'tr', 'pl', 'nl', 'se', 'no'
    ];
  }

  async close(): Promise<void> {
    // Закрытие не требуется для упрощенной версии
    console.log('Google Play Parser закрыт');
  }
}
