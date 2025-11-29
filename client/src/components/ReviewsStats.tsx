import React, { useMemo } from 'react';
import { Star, ExternalLink, TrendingUp, BarChart3 } from 'lucide-react';
import { Review, AppSearchResult } from '@/types';

interface ReviewsStatsProps {
  reviews: Review[];
  totalReviews: number;
  selectedApp: AppSearchResult;
  onExport: () => void;
}

export const ReviewsStats: React.FC<ReviewsStatsProps> = ({
  reviews,
  totalReviews,
  selectedApp,
  onExport
}) => {
  // 1. Вычисляем статистику
  const stats = useMemo(() => {
    if (!reviews.length) return null;

    // Средний рейтинг
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / reviews.length;

    // Распределение оценок
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    reviews.forEach(r => {
      const rating = Math.floor(r.rating) as 1 | 2 | 3 | 4 | 5;
      if (distribution[rating] !== undefined) {
        distribution[rating]++;
      }
    });

    // Тренд (агрегация по неделям, чтобы график был информативнее)
    const reviewsByWeek = reviews.reduce((acc, r) => {
      const d = new Date(r.date);
      if (Number.isNaN(d.getTime())) {
        return acc;
      }
      // Нормализуем к началу дня
      d.setHours(0, 0, 0, 0);
      // Находим понедельник этой недели (week-start)
      const day = d.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = (day + 6) % 7; // смещение до понедельника
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - diffToMonday);
      const key = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!acc[key]) {
        acc[key] = { sum: 0, count: 0, date: weekStart };
      }
      acc[key].sum += r.rating;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number; date: Date }>);

    const trendData = Object.values(reviewsByWeek)
      .map((data) => ({
        date: data.date.toISOString().split('T')[0],
        avg: data.sum / data.count,
        count: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      average,
      distribution,
      trendData
    };
  }, [reviews]);

  // Ссылка на стор
  const storeLink = useMemo(() => {
    if (selectedApp.store === 'google') {
      return `https://play.google.com/store/apps/details?id=${selectedApp.id}`;
    } else {
      const appId = selectedApp.id.startsWith('id') ? selectedApp.id : `id${selectedApp.id}`;
      return `https://apps.apple.com/app/${appId}`;
    }
  }, [selectedApp]);

  if (!reviews.length) return null;


  return (
    <div className="card mb-6 dark:border-gray-700">
      <div className="card-header pb-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="card-title flex items-center gap-2">
            {selectedApp.name}
            <a 
              href={storeLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title={`Открыть в ${selectedApp.store === 'google' ? 'Google Play' : 'App Store'}`}
            >
              <ExternalLink size={18} />
            </a>
          </h2>
          <p className="card-description mt-1">
            Показано {reviews.length} из {totalReviews} отзывов
          </p>
        </div>
        <button
          onClick={onExport}
          className="btn btn-outline btn-sm whitespace-nowrap"
        >
          Экспорт CSV/JSON
        </button>
      </div>

      <div className="card-content pt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* 1. Средний рейтинг */}
        <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">Средний рейтинг</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              {stats?.average.toFixed(1)}
            </span>
            <span className="text-lg text-gray-400 font-medium">/ 5</span>
          </div>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                className={`w-6 h-6 ${
                  star <= Math.round(stats?.average || 0) 
                    ? 'fill-amber-400 text-amber-400' 
                    : 'text-gray-200 dark:text-gray-600'
                }`} 
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {reviews.length} оценок
          </div>
        </div>

        {/* 2. Гистограмма распределения */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Распределение оценок</span>
          </div>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats?.distribution[rating] || 0;
              const percentage = (count / reviews.length) * 100;
              
              let barColor = 'bg-gray-200';
              if (rating >= 4) barColor = 'bg-emerald-500';
              else if (rating === 3) barColor = 'bg-amber-400';
              else barColor = 'bg-rose-500';

              return (
                <div key={rating} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 w-6 shrink-0 font-medium text-gray-600 dark:text-gray-400">
                    <span>{rating}</span>
                    <Star size={10} className="fill-current text-gray-300" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-gray-500 dark:text-gray-400 text-xs shrink-0 tabular-nums">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Тренд (Sparkline) */}
        <div className="flex flex-col h-full min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Динамика (по неделям)</span>
          </div>
          
          {stats && stats.trendData.length > 0 ? (
            <div className="flex-1 flex items-end gap-1 relative min-h-[120px] pb-6 border-b border-gray-100 dark:border-gray-800">
              {stats.trendData.slice(-14).map((day) => {
                 const heightPercent = Math.max(10, (day.avg / 5) * 100);
                 let barColor = 'bg-gray-300 dark:bg-gray-600';
                 if (day.avg >= 4) barColor = 'bg-emerald-400';
                 else if (day.avg >= 3) barColor = 'bg-amber-400';
                 else barColor = 'bg-rose-400';

                 return (
                   <div key={day.date} className="flex-1 flex flex-col justify-end items-center h-full group relative" title={`${new Date(day.date).toLocaleDateString()} - ★${day.avg.toFixed(1)}`}>
                     <div 
                        className={`w-full max-w-[8px] rounded-t-sm ${barColor}`}
                        style={{ height: `${heightPercent}%` }}
                     />
                   </div>
                 );
              })}
              
              {/* Подписи по оси времени */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 pt-2">
                {stats.trendData.length === 1 ? (
                  <span className="mx-auto">
                    {new Date(stats.trendData[0].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                ) : (
                  <>
                    <span>{new Date(stats.trendData[Math.max(0, stats.trendData.length - 14)].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                    <span>{new Date(stats.trendData[stats.trendData.length - 1].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              Нет данных о динамике
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
