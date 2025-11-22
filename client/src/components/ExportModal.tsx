// Назначение файла: модальное окно экспорта. Теперь скачиваем файл напрямую из ответа /export без отдельного запроса /download.
import React, { useState } from 'react';
import { X, Download, FileText, Database } from 'lucide-react';
import { FilterOptions, ExportRequest, AppSearchResult } from '@/types';
import { apiService } from '@/services/api';
import { downloadFile } from '@/utils/helpers';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedApp: AppSearchResult | null;
  filters: FilterOptions;
  totalReviews: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  selectedApp,
  filters,
  totalReviews
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const exportRequest: ExportRequest = {
        appName: selectedApp?.name,
        appId: selectedApp?.id,
        store: filters.store,
        ratings: filters.ratings,
        region: filters.region,
        startDate: filters.startDate,
        endDate: filters.endDate,
        format: exportFormat,
        total: totalReviews // Отправляем общее количество для выгрузки
      };

      // Получаем Blob и имя файла напрямую из /export
      const { blob, filename } = await apiService.exportReviews(exportRequest);
      downloadFile(blob, filename);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка экспорта');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Экспорт отзывов
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Информация о экспорте */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Информация об экспорте
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Приложение: <span className="font-medium">{selectedApp?.name || 'Не выбрано'}</span></div>
                <div>Количество отзывов: <span className="font-medium">{totalReviews}</span></div>
                {filters.store && (
                  <div>Магазин: <span className="font-medium">
                    {filters.store === 'google' ? 'Google Play' : 'App Store'}
                  </span></div>
                )}
                {filters.ratings && filters.ratings.length > 0 && (
                  <div>Рейтинг: <span className="font-medium">
                    {filters.ratings.join(', ')} звёзд
                  </span></div>
                )}
                {filters.region && (
                  <div>Регион: <span className="font-medium">{filters.region.toUpperCase()}</span></div>
                )}
                {(filters.startDate || filters.endDate) && (
                  <div>Период: <span className="font-medium">
                    {filters.startDate?.toLocaleDateString('ru-RU')} - {filters.endDate?.toLocaleDateString('ru-RU')}
                  </span></div>
                )}
              </div>
            </div>

            {/* Выбор формата */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Формат файла
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    exportFormat === 'csv'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <FileText className="w-6 h-6 mb-2" />
                  <div className="font-medium">CSV</div>
                  <div className="text-xs text-gray-500">
                    Для Excel и таблиц
                  </div>
                </button>

                <button
                  onClick={() => setExportFormat('json')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    exportFormat === 'json'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Database className="w-6 h-6 mb-2" />
                  <div className="font-medium">JSON</div>
                  <div className="text-xs text-gray-500">
                    Для разработчиков
                  </div>
                </button>
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <ErrorMessage 
                message={error} 
                onRetry={() => setError(null)}
              />
            )}

            {/* Действия */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="btn btn-ghost btn-md"
              >
                Отмена
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || totalReviews === 0}
                className="btn btn-primary btn-md"
              >
                {isExporting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Экспорт...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать {exportFormat.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
