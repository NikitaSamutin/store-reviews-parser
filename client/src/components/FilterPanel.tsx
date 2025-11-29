import React from 'react';
import { Calendar, RotateCcw, ChevronDown } from 'lucide-react';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import { FilterOptions, AppSearchResult } from '@/types';
import { RATINGS, MONTHS, YEARS } from '@/utils/constants';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  isLoading: boolean;
  selectedApp: AppSearchResult;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  isLoading,
}) => {
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value, offset: 0 });
  };

  const handleDateChange = (type: 'start' | 'end', part: 'month' | 'year', value: number | null) => {
    const newFilters = { ...filters };
    const currentStartDate = filters.startDate ? new Date(filters.startDate) : new Date();
    const currentEndDate = filters.endDate ? new Date(filters.endDate) : new Date();

    if (type === 'start') {
      const year = part === 'year' ? value : currentStartDate.getFullYear();
      const month = part === 'month' ? value : currentStartDate.getMonth();
      if (year !== null && month !== null) {
        newFilters.startDate = new Date(year, month, 1);
      }
    } else {
      const year = part === 'year' ? value : currentEndDate.getFullYear();
      const month = part === 'month' ? value : currentEndDate.getMonth();
      if (year !== null && month !== null) {
        newFilters.endDate = new Date(year, month + 1, 0);
      }
    }
    onFiltersChange({ ...newFilters, offset: 0 });
  };

  const resetFilters = () => {
    onFiltersChange({ limit: 50, offset: 0 });
  };

  // Опции для селектов
  const ratingOptions = RATINGS.map(rating => ({
    value: rating.value,
    label: `${rating.icon} ${rating.label}`
  }));

  const monthOptions = MONTHS.map((month, index) => ({
    value: index,
    label: month
  }));

  const yearOptions = YEARS.map(year => ({
    value: year,
    label: year.toString()
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Фильтр по рейтингу (множественный выбор) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Рейтинг
          </label>
          <Select
            value={ratingOptions.filter(option => 
              filters.ratings?.includes(option.value)
            )}
            onChange={(options) => 
              handleFilterChange('ratings', options.map(opt => opt.value))
            }
            options={ratingOptions}
            placeholder="Все рейтинги"
            isMulti
            isClearable
            isDisabled={isLoading}
            className="react-select"
            classNamePrefix="react-select"
          />
        </div>

        {/* Количество отзывов на странице */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            На странице
          </label>
          <div className="relative">
            <select
              className="input appearance-none pr-10"
              value={filters.limit || 50}
              onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
              disabled={isLoading}
            >
              <option value={25}>25 отзывов</option>
              <option value={50}>50 отзывов</option>
              <option value={100}>100 отзывов</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Фильтр по периоду */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Calendar className="inline w-4 h-4 mr-1" />
          Период
        </label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">С месяца</label>
            <Select
              value={filters.startDate ? monthOptions.find(option => option.value === new Date(filters.startDate!).getMonth()) : null}
              onChange={(option) => handleDateChange('start', 'month', option?.value ?? null)}
              options={monthOptions}
              placeholder="Месяц"
              isClearable
              isDisabled={isLoading}
              className="react-select"
              classNamePrefix="react-select"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">С года</label>
            <Select
              value={filters.startDate ? yearOptions.find(option => option.value === new Date(filters.startDate!).getFullYear()) : null}
              onChange={(option) => handleDateChange('start', 'year', option?.value ?? null)}
              options={yearOptions}
              placeholder="Год"
              isClearable
              isDisabled={isLoading}
              className="react-select"
              classNamePrefix="react-select"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">По месяц</label>
            <Select
              value={filters.endDate ? monthOptions.find(option => option.value === new Date(filters.endDate!).getMonth()) : null}
              onChange={(option) => handleDateChange('end', 'month', option?.value ?? null)}
              options={monthOptions}
              placeholder="Месяц"
              isClearable
              isDisabled={isLoading}
              className="react-select"
              classNamePrefix="react-select"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">По год</label>
            <Select
              value={filters.endDate ? yearOptions.find(option => option.value === new Date(filters.endDate!).getFullYear()) : null}
              onChange={(option) => handleDateChange('end', 'year', option?.value ?? null)}
              options={yearOptions}
              placeholder="Год"
              isClearable
              isDisabled={isLoading}
              className="react-select"
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={resetFilters}
          disabled={isLoading}
          className="btn btn-ghost btn-sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Сбросить фильтры
        </button>
      </div>


    </div>
  );
};
