export interface Review {
    id: string;
    appName: string;
    store: 'google' | 'apple';
    rating: number;
    title: string;
    content: string;
    author: string;
    date: Date;
    region: string;
    version?: string;
    helpful?: number;
}
export interface AppSearchResult {
    id: string;
    name: string;
    developer: string;
    icon?: string;
    store: 'google' | 'apple';
}
export interface FilterOptions {
    store?: 'google' | 'apple';
    ratings?: number[];
    region?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    appId?: string;
}
export interface ParseOptions {
    appId: string;
    store: 'google' | 'apple';
    appName?: string;
    region?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    total?: number;
}
//# sourceMappingURL=index.d.ts.map