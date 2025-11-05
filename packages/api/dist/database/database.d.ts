import { Review } from '../types/index.js';
export declare class Database {
    private db;
    private inMemory;
    private memReviews;
    constructor();
    private initTables;
    saveReviews(reviews: Review[]): Promise<void>;
    getReviews(filters: {
        appName?: string;
        appId?: string;
        store?: string;
        ratings?: number[];
        region?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        reviews: Review[];
        total: number;
    }>;
    close(): void;
}
//# sourceMappingURL=database.d.ts.map