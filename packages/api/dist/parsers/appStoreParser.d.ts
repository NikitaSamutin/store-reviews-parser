import { Review, AppSearchResult } from '../types/index.js';
export declare class AppStoreParser {
    private baseUrl;
    searchApps(query: string, region?: string): Promise<AppSearchResult[]>;
    parseReviews(appId: string, region?: string): Promise<Review[]>;
    getAvailableRegions(): Promise<string[]>;
}
//# sourceMappingURL=appStoreParser.d.ts.map