import { Review, AppSearchResult } from '../types';
export declare class GooglePlayParser {
    private regionToLang;
    init(): Promise<void>;
    searchApps(query: string, region?: string): Promise<AppSearchResult[]>;
    parseReviews(appId: string, region?: string): Promise<Review[]>;
    getAvailableRegions(): string[];
    close(): Promise<void>;
}
//# sourceMappingURL=googlePlayParser.d.ts.map