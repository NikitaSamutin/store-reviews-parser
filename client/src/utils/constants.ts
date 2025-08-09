import { StoreOption, RatingOption, RegionOption } from '@/types';

export const STORES: StoreOption[] = [
  {
    value: 'google',
    label: 'Google Play',
    icon: '🤖'
  },
  {
    value: 'apple',
    label: 'App Store',
    icon: '🍎'
  }
];

export const RATINGS: RatingOption[] = [
  {
    value: 1,
    label: '1 звезда',
    icon: '⭐'
  },
  {
    value: 2,
    label: '2 звезды',
    icon: '⭐⭐'
  },
  {
    value: 3,
    label: '3 звезды',
    icon: '⭐⭐⭐'
  },
  {
    value: 4,
    label: '4 звезды',
    icon: '⭐⭐⭐⭐'
  },
  {
    value: 5,
    label: '5 звёзд',
    icon: '⭐⭐⭐⭐⭐'
  }
];

export const REGIONS: RegionOption[] = [
  { value: 'ru', label: '🇷🇺 Россия' },
  { value: 'us', label: '🇺🇸 США' },
  { value: 'gb', label: '🇬🇧 Великобритания' },
  { value: 'de', label: '🇩🇪 Германия' },
  { value: 'fr', label: '🇫🇷 Франция' },
  { value: 'it', label: '🇮🇹 Италия' },
  { value: 'es', label: '🇪🇸 Испания' },
  { value: 'jp', label: '🇯🇵 Япония' },
  { value: 'kr', label: '🇰🇷 Южная Корея' },
  { value: 'cn', label: '🇨🇳 Китай' },
  { value: 'au', label: '🇦🇺 Австралия' },
  { value: 'ca', label: '🇨🇦 Канада' },
  { value: 'br', label: '🇧🇷 Бразилия' },
  { value: 'mx', label: '🇲🇽 Мексика' },
  { value: 'in', label: '🇮🇳 Индия' },
  { value: 'tr', label: '🇹🇷 Турция' },
  { value: 'pl', label: '🇵🇱 Польша' },
  { value: 'nl', label: '🇳🇱 Нидерланды' },
  { value: 'se', label: '🇸🇪 Швеция' },
  { value: 'no', label: '🇳🇴 Норвегия' }
];

export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV файл' },
  { value: 'json', label: 'JSON файл' }
];

export const DEFAULT_FILTERS = {
  limit: 50,
  offset: 0
};

export const LOAD_MORE_COUNT = 50;

export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
