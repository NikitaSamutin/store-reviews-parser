"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooglePlayParser = void 0;
const gplay = require('google-play-scraper');
class GooglePlayParser {
    regionToLang(region) {
        if (!region)
            return 'en';
        const map = {
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
    async init() {
        // Инициализация не требуется для упрощенной версии
    }
    async searchApps(query, region = 'us') {
        try {
            const results = await gplay.default.search({
                term: query,
                num: 10,
                country: region,
                lang: this.regionToLang(region),
            });
            return results.map((app) => ({
                id: app.appId,
                name: app.title,
                developer: app.developer,
                icon: app.icon,
                store: 'google',
            }));
        }
        catch (error) {
            console.error('Ошибка поиска приложений в Google Play:', error);
            return [];
        }
    }
    async parseReviews(appId, region) {
        try {
            const app = await gplay.default.app({ appId, country: region, lang: this.regionToLang(region) });
            const appName = app.title;
            const regions = region ? [region] : this.getAvailableRegions();
            const allReviewsMap = new Map();
            // Функция для получения отзывов с пагинацией
            const getReviewsWithPagination = async (region, maxReviews = 1000) => {
                const reviews = [];
                let nextToken;
                let currentPage = 0;
                const maxPages = 10; // Ограничиваем количество страниц для избежания бесконечного цикла
                try {
                    do {
                        const response = await gplay.default.reviews({
                            appId: appId,
                            country: region,
                            lang: this.regionToLang(region),
                            sort: gplay.default.sort.NEWEST,
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
                        }
                        else {
                            break;
                        }
                    } while (nextToken && reviews.length < maxReviews && currentPage < maxPages);
                    return reviews;
                }
                catch (error) {
                    console.log(`Не удалось получить отзывы для региона ${region}:`, error instanceof Error ? error.message : String(error));
                    return [];
                }
            };
            // Получаем отзывы из основных регионов с пагинацией
            const primaryRegions = ['us', 'ru', 'gb', 'de', 'fr']; // Ограничиваем основными регионами для производительности
            for (const region of primaryRegions) {
                console.log(`Получаем отзывы для региона ${region}...`);
                const regionReviews = await getReviewsWithPagination(region, 1000);
                regionReviews.forEach((review) => {
                    // Пропускаем отзывы с пустым содержимым или некорректными данными
                    if (!review.text || !review.text.trim() || !review.id || !review.userName) {
                        return;
                    }
                    const reviewData = {
                        id: review.id,
                        appName,
                        store: 'google',
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
        }
        catch (error) {
            console.error(`Ошибка парсинга отзывов Google Play для ${appId}:`, error);
            return [];
        }
    }
    getAvailableRegions() {
        // Основные регионы для Google Play
        return [
            'ru', 'us', 'gb', 'de', 'fr', 'it', 'es', 'jp', 'kr',
            'au', 'ca', 'br', 'mx', 'in', 'tr', 'pl', 'nl', 'se', 'no'
        ];
    }
    async close() {
        // Закрытие не требуется для упрощенной версии
        console.log('Google Play Parser закрыт');
    }
}
exports.GooglePlayParser = GooglePlayParser;
//# sourceMappingURL=googlePlayParser.js.map