import { Review, AppSearchResult, FilterOptions, ParseOptions } from '../types/index.js';
export declare class ReviewService {
    private googleParser;
    private appStoreParser;
    private database;
    constructor();
    searchApps(query: string, region?: string, store?: 'google' | 'apple'): Promise<AppSearchResult[]>;
    parseAndSaveReviews(options: ParseOptions): Promise<Review[]>;
    getReviews(filters: FilterOptions): Promise<{
        reviews: Review[];
        total: number;
    }>;
    getFilteredReviews(appName: string, filters: FilterOptions): Promise<{
        reviews: Review[];
        total: number;
    }>;
    getAvailableRegions(): Promise<string[]>;
    close(): Promise<void>;
}
//# sourceMappingURL=reviewService.d.ts.map