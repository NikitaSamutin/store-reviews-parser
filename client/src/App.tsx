import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { FilterPanel } from './components/FilterPanel';
import { ReviewsList } from './components/ReviewsList';
import { ExportModal } from './components/ExportModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { ReviewsListSkeleton } from './components/ReviewsListSkeleton';
import { EmptyState } from './components/EmptyState';
import debounce from 'lodash.debounce';
import { apiService } from './services/api';
import { Review, AppSearchResult, FilterOptions } from './types';
import { DEFAULT_FILTERS, LOAD_MORE_COUNT } from './utils/constants';

function App() {
  const [selectedApp, setSelectedApp] = useState<AppSearchResult | null>(null);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  // Контекст поиска из SearchForm
  const [searchRegion, setSearchRegion] = useState<string>('us');
  // const [searchStore, setSearchStore] = useState<'google' | 'apple' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Загрузка отзывов с фильтрами
  const loadReviews = async (newFilters: FilterOptions = filters, reset: boolean = false, targetApp?: AppSearchResult) => {
    const appToUse = targetApp || selectedApp;
    console.log('App: loadReviews called with app:', appToUse?.name, 'reset:', reset);
    if (!appToUse) {
      console.log('App: loadReviews - no app provided, returning');
      return;
    }

    try {
      setIsLoading(reset);
      setError(null);

      const currentOffset = reset ? 0 : filteredReviews.length;
      // Обеспечим наличие ключевых фильтров store/region
      const baseFilters: FilterOptions = {
        ...newFilters,
        store: newFilters.store || (appToUse?.store as 'google' | 'apple' | undefined),
        region: newFilters.region || searchRegion,
      };
      const filtersWithOffset = { ...baseFilters, offset: currentOffset };
      
      console.log('App: loadReviews - calling apiService.getReviews with:', appToUse.id, filtersWithOffset);
      const result = await apiService.getReviews(appToUse.id, filtersWithOffset);
      console.log('App: loadReviews - got result:', result.reviews.length, 'reviews, total:', result.total);
      
      if (reset) {
        setFilteredReviews(result.reviews);
      } else {
        setFilteredReviews(prev => [...prev, ...result.reviews]);
      }
      
      setTotalReviews(result.total);
      setHasMoreReviews(result.reviews.length === (newFilters.limit || LOAD_MORE_COUNT));
      console.log('App: loadReviews - state updated, filteredReviews length:', result.reviews.length);
    } catch (err) {
      console.error('App: loadReviews error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки отзывов');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      console.log('App: loadReviews finished');
    }
  };

  // Парсинг новых отзывов при выборе приложения
  const parseReviews = async (app: AppSearchResult) => {
    console.log('App: parseReviews called with app:', app);
    
    // 1. Сброс состояния
    setSelectedApp(app);
    setFilteredReviews([]);
    setFilters(DEFAULT_FILTERS);
    setError(null);
    setTotalReviews(0);
    setHasMoreReviews(false);
    setIsParsing(true);
    
    console.log('App: state reset, starting parsing...');

    try {
      // 2. Парсинг
      // 2. Парсинг. Отзывы сохраняются на бэкенде.
      console.log('App: calling apiService.parseReviews...');
      const parseResult = await apiService.parseReviews({
        appId: app.id,
        store: app.store,
        // Передаем локализованное имя, чтобы сервер сохранял отзывы под тем же именем
        appName: app.name,
        // Передаем выбранный регион для парсинга магазина
        region: searchRegion,
      });
      console.log('App: parseReviews result:', parseResult?.length, 'reviews');
      
      // 3. Загрузка и отображение с дефолтными фильтрами
      console.log('App: loading reviews with region filter...');
      await loadReviews({ ...DEFAULT_FILTERS, region: searchRegion, store: app.store }, true, app);
      console.log('App: reviews loaded successfully');
    } catch (err) {
      console.error('App: parseReviews error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка парсинга отзывов');
      setFilteredReviews([]); // Очищаем отзывы в случае ошибки парсинга
      setTotalReviews(0);
    } finally {
      setIsParsing(false);
      console.log('App: parseReviews finished, isParsing set to false');
    }
  };

  // Применение фильтров
  // Используем useCallback, чтобы функция не создавалась заново при каждом рендере
  const debouncedLoadReviews = useCallback(
    debounce((newFilters: FilterOptions) => {
      loadReviews(newFilters, true);
    }, 500), // Задержка в 500 мс
    [selectedApp] // Зависимость, чтобы функция пересоздавалась при смене приложения
  );

  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    debouncedLoadReviews(newFilters);
  };

  // Отменяем предыдущий запланированный вызов при размонтировании компонента
  useEffect(() => {
    return () => {
      debouncedLoadReviews.cancel();
    };
  }, [debouncedLoadReviews]);

  // Загрузка дополнительных отзывов
  const loadMoreReviews = async () => {
    if (isLoadingMore || !hasMoreReviews) return;
    
    setIsLoadingMore(true);
    await loadReviews(filters, false);
  };



  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <Routes>
            <Route path="/" element={
              <div className="space-y-6">
                {/* Форма поиска */}
                <div className="card">
                  <div className="card-header">
                    <h1 className="card-title">Парсер отзывов приложений</h1>
                    <p className="card-description">
                      Найдите приложение и получите отзывы из App Store и Google Play
                    </p>
                  </div>
                  <div className="card-content">
                    <SearchForm 
                      onParseReviews={parseReviews}
                      isParsing={isParsing}
                      selectedApp={selectedApp}
                      onContextChange={({ region }) => {
                        // Сброс зависимого состояния при смене магазина/региона в поиске
                        setSelectedApp(null);
                        setFilteredReviews([]);
                        setFilters({ ...DEFAULT_FILTERS, region: region === 'all' ? undefined : region });
                        setError(null);
                        setTotalReviews(0);
                        setHasMoreReviews(false);
                        setSearchRegion(region);
                      }}
                    />
                  </div>
                </div>

                {/* Панель фильтров */}
                {selectedApp && (
                  <div className="card">
                    <div className="card-header">
                      <h2 className="text-lg font-semibold">Фильтры</h2>
                      <p className="text-sm text-gray-500">
                        Настройте фильтры для отображения нужных отзывов
                      </p>
                    </div>
                    <div className="card-content">
                      <FilterPanel
                        filters={filters}
                        onFiltersChange={applyFilters}
                        isLoading={isLoading}
                        selectedApp={selectedApp}
                      />
                    </div>
                  </div>
                )}

                {/* Результаты */}
                {selectedApp && (
                  <div className="card">
                    <div className="card-header">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold">
                            Отзывы для "{selectedApp.name}"
                          </h2>
                          <p className="text-sm text-gray-500">
                            {totalReviews > 0 && `Найдено ${totalReviews} отзывов`}
                          </p>
                        </div>
                        {filteredReviews.length > 0 && (
                          <button
                            onClick={() => setShowExportModal(true)}
                            className="btn btn-outline btn-sm"
                          >
                            Экспорт
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="card-content">
                      {/* Состояния загрузки и ошибок */}
                      {isParsing && (
                        <div className="flex items-center justify-center py-12">
                          <LoadingSpinner size="lg" />
                          <span className="ml-3 text-lg">Парсим отзывы...</span>
                        </div>
                      )}

                      {isLoading && !isParsing && <ReviewsListSkeleton />}

                      {error && (
                        <ErrorMessage 
                          message={error} 
                          onRetry={() => loadReviews(filters, true)}
                        />
                      )}

                      {/* Список отзывов */}
                      {!isLoading && !isParsing && !error && (
                        <>
                          {filteredReviews.length > 0 ? (
                            <>
                              <ReviewsList 
                                reviews={filteredReviews}
                                isLoading={isLoadingMore}
                              />
                              
                              {/* Кнопка "Показать ещё" */}
                              {hasMoreReviews && (
                                <div className="flex justify-center mt-6">
                                  <button
                                    onClick={loadMoreReviews}
                                    disabled={isLoadingMore}
                                    className="btn btn-outline btn-md"
                                  >
                                    {isLoadingMore ? (
                                      <>
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2">Загрузка...</span>
                                      </>
                                    ) : (
                                      'Показать ещё 50'
                                    )}
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <EmptyState
                              title="Отзывы не найдены"
                              description="Попробуйте изменить фильтры или спарсить отзывы заново"
                              action={
                                <button
                                  onClick={() => parseReviews(selectedApp)}
                                  className="btn btn-primary btn-md"
                                >
                                  Спарсить отзывы
                                </button>
                              }
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Пустое состояние */}
                {!selectedApp && !isParsing && (
                  <div>
                    <EmptyState
                      title="Выберите приложение"
                      description="Введите название приложения в поле поиска выше, чтобы начать парсинг отзывов"
                      icon="🔍"
                    />
                    
                    {/* Тестовая кнопка для отладки */}
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => {
                          console.log('Test button clicked');
                          const testApp = {
                            id: "org.telegram.messenger",
                            name: "Telegram",
                            developer: "Telegram FZ-LLC",
                            icon: "https://play-lh.googleusercontent.com/ZU9cSsyIJZo6Oy7HTHiEPwZg0m2Crep-d5ZrfajqtsH-qgUXSqKpNA2FpPDTn-7qA5Q",
                            store: "google" as const
                          };
                          parseReviews(testApp);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        🧪 Тест: Выбрать Telegram
                      </button>
                    </div>
                  </div>
                )}
              </div>
            } />
          </Routes>
        </main>

        {/* Модальное окно экспорта */}
        {showExportModal && selectedApp && (
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            selectedApp={selectedApp}
            filters={filters}
            totalReviews={totalReviews}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
