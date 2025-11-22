import { Review, AppSearchResult } from '../types/index.js';
export declare class GooglePlayParser {
    private gplay;
    private regionToLang;
    init(): Promise<void>;
    searchApps(query: string, region?: string): Promise<AppSearchResult[]>;
    parseReviews(appId: string, region?: string): Promise<Review[]>;
    getAvailableRegions(): string[];
    close(): Promise<void>;
}
//# sourceMappingURL=googlePlayParser.d.ts.map