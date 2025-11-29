import React, { useState, useEffect, useRef } from 'react';
import { Search, Smartphone, ChevronDown } from 'lucide-react';
import { AppSearchResult } from '@/types';
import { apiService } from '@/services/api';
import { debounce } from '@/utils/helpers';
import { getStoreIcon, getStoreName } from '@/utils/helpers';
import { LoadingSpinner } from './LoadingSpinner';
import { REGIONS, STORES } from '@/utils/constants';

interface SearchFormProps {
  onParseReviews: (app: AppSearchResult) => void;
  isParsing: boolean;
  selectedApp: AppSearchResult | null;
  // Вызывается при смене магазина или региона, чтобы сбросить зависящее состояние выше
  onContextChange?: (ctx: { store: 'google' | 'apple' | 'all'; region: string }) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onParseReviews,
  isParsing,
  selectedApp,
  onContextChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AppSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedStore, setSelectedStore] = useState<'google' | 'apple' | 'all'>('all');
  const [searchRegion, setSearchRegion] = useState('us');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Сброс результатов поиска при смене региона или магазина
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setSearchResults([]);
      setShowResults(false);
    }
    // Уведомляем верхний уровень, что контекст поиска изменился (магазин/регион)
    onContextChange?.({ store: selectedStore, region: searchRegion });
  }, [searchRegion, selectedStore]);

  useEffect(() => {
    const debouncedSearch = debounce(async (query: string, region: string, store: 'google' | 'apple' | 'all') => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      try {
        setIsSearching(true);
        
        // Передаем параметр магазина в API, если выбран конкретный магазин
        const storeParam = store === 'all' ? undefined : store;
        const results = await apiService.searchApps(query, region, storeParam);
        
        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error('Ошибка поиска:', error);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    debouncedSearch(searchQuery, searchRegion, selectedStore);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, searchRegion, selectedStore]);

  const handleSelectApp = (app: AppSearchResult) => {
    console.log('SearchForm: handleSelectApp called with app:', app);
    setSearchQuery(app.name);
    setShowResults(false);
    setSearchResults([]);
    console.log('SearchForm: calling onParseReviews with app:', app);
    onParseReviews(app); // Сразу запускаем парсинг
  };



  return (
    <div className="space-y-6">
      <div className="relative" ref={searchContainerRef}>
        {/* Переключатель магазина (Segmented Control) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Магазин приложений
          </label>
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { setSelectedStore('all'); onContextChange?.({ store: 'all', region: searchRegion }); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedStore === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>🌐</span>
              <span>Все</span>
            </button>
            {STORES.map((store) => (
              <button
                key={store.value}
                onClick={() => { setSelectedStore(store.value); onContextChange?.({ store: store.value, region: searchRegion }); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedStore === store.value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span>{store.icon}</span>
                <span>{store.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название приложения
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="search"
                type="text"
                className="input !pl-10"
                placeholder="Например, Telegram"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            <label htmlFor="search-region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Регион поиска
            </label>
            <div className="relative">
              <select
                id="search-region"
                className="input appearance-none pr-10"
                value={searchRegion}
                onChange={(e) => { const r = e.target.value; setSearchRegion(r); onContextChange?.({ store: selectedStore, region: r }); }}
              >
                {REGIONS.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto md:w-3/4">
            {searchResults.map((app) => (
              <button
                key={`${app.store}-${app.id}`}
                onClick={() => handleSelectApp(app)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  {app.icon ? (
                    <img
                      src={app.icon}
                      alt={app.name}
                      className="w-10 h-10 rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {app.name}
                      </p>
                      <span className="text-lg">{getStoreIcon(app.store)}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {app.developer} • {getStoreName(app.store)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-4 md:w-3/4">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Приложения не найдены. Попробуйте изменить запрос.
            </p>
          </div>
        )}
      </div>

      {isParsing && selectedApp && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-3">
             <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
             <div>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
             </div>
             <div className="ml-auto flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm font-medium text-gray-600">Собираем отзывы...</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
