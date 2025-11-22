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
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

export interface ParseRequest {
  appId: string;
  store: 'google' | 'apple';
  // Optional localized app name chosen by user to preserve in DB
  appName?: string;
  // Optional region to limit parsing (e.g., 'ru', 'us')
  region?: string;
}

export interface ExportRequest {
  appName?: string;
  appId?: string;
  store?: 'google' | 'apple';
  ratings?: number[];
  region?: string;
  startDate?: Date;
  endDate?: Date;
  format: 'csv' | 'json';
  total?: number;
}

export interface RegionOption {
  value: string;
  label: string;
}

export interface StoreOption {
  value: 'google' | 'apple';
  label: string;
  icon: string;
}

export interface RatingOption {
  value: number;
  label: string;
  icon: string;
}
