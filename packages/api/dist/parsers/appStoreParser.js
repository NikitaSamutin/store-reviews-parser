"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStoreParser = void 0;
const axios_1 = __importDefault(require("axios"));
class AppStoreParser {
    constructor() {
        this.baseUrl = 'https://itunes.apple.com';
    }
    async searchApps(query, region = 'ru') {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/search`, {
                params: {
                    term: query,
                    country: region,
                    entity: 'software',
                    limit: 10
                }
            });
            const apps = response.data.results.map((app) => ({
                id: app.trackId.toString(),
                name: app.trackName,
                developer: app.artistName,
                icon: app.artworkUrl100,
                store: 'apple'
            }));
            return apps;
        }
        catch (error) {
            console.error('Ошибка поиска приложений в App Store:', error);
            return [];
        }
    }
    async parseReviews(appId, region) {
        try {
            // 1. Получаем информацию о приложении (один раз)
            const lookupCountry = region || 'us';
            const appResponse = await axios_1.default.get(`${this.baseUrl}/lookup`, {
                params: { id: appId, country: lookupCountry },
            });
            const appInfo = appResponse.data.results[0];
            if (!appInfo)
                throw new Error('Приложение не найдено');
            const appName = appInfo.trackName;
            // 2. Получаем список регионов для парсинга: либо один выбранный, либо набор по умолчанию
            const regions = region ? [region] : await this.getAvailableRegions();
            const allReviewsMap = new Map();
            // 3. Создаем задачи для парсинга каждого региона
            const regionPromises = regions.map(async (region) => {
                const regionalReviews = [];
                const pagePromises = [];
                // App Store RSS feed отдает до 10 страниц
                for (let page = 1; page <= 10; page++) {
                    const url = `${this.baseUrl}/${region}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`;
                    pagePromises.push(axios_1.default.get(url).catch(() => null)); // Игнорируем ошибки отдельных запросов
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
                            }
                            catch (parseError) { }
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
        }
        catch (error) {
            console.error('Ошибка парсинга отзывов App Store:', error);
            return [];
        }
    }
    async getAvailableRegions() {
        // Основные регионы для App Store
        return [
            'ru', 'us', 'gb', 'de', 'fr', 'it', 'es', 'jp', 'kr', 'cn',
            'au', 'ca', 'br', 'mx', 'in', 'tr', 'pl', 'nl', 'se', 'no'
        ];
    }
}
exports.AppStoreParser = AppStoreParser;
//# sourceMappingURL=appStoreParser.js.map