// Назначение файла: сервис формирования экспортируемых данных (CSV/JSON) в памяти без записи на диск (дружественно к serverless)
import { Review } from '../types/index.js';

// Тип результата экспорта — возвращаем содержимое и метаданные, чтобы роут мог сразу отдать файл клиенту
export type ExportResult = {
  filename: string;
  contentType: string;
  // Содержимое файла. Для CSV добавляем BOM на стороне маршрута для лучшей поддержки Excel.
  content: string;
};

export class ExportService {
  // Экспорт CSV: формируем данные в памяти, экранируем поля, локализуем дату, нормализуем магазин
  async exportToCSV(reviews: Review[], filename?: string): Promise<ExportResult> {
    try {
      const fileName = filename || `reviews_${Date.now()}.csv`;

      // Заголовки CSV (в человеко-читаемом виде на русском)
      const headers = [
        'ID',
        'Название приложения',
        'Магазин',
        'Рейтинг',
        'Заголовок',
        'Содержание',
        'Автор',
        'Дата',
        'Регион',
        'Версия',
        'Полезность',
      ];

      // Хелпер экранирования для CSV
      const escapeCsv = (value: unknown): string => {
        const str = value === null || value === undefined ? '' : String(value);
        // Экранируем двойные кавычки и оборачиваем в кавычки, если встречаются разделители/переводы строк
        const needsQuotes = /[",\n;]/.test(str);
        const escaped = str.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
      };

      const lines: string[] = [];
      // Разделитель ";" лучше открывается в русской локали Excel
      const sep = ';';

      // Заголовок
      lines.push(headers.join(sep));

      // Строки данных
      for (const review of reviews) {
        const row = [
          escapeCsv(review.id),
          escapeCsv(review.appName),
          escapeCsv(review.store === 'google' ? 'Google Play' : 'App Store'),
          escapeCsv(review.rating),
          escapeCsv(review.title || ''),
          escapeCsv(review.content || ''),
          escapeCsv(review.author || ''),
          escapeCsv(new Date(review.date).toLocaleDateString('ru-RU')),
          escapeCsv(review.region || ''),
          escapeCsv(review.version || ''),
          escapeCsv((review as any).helpful ?? ''),
        ];
        lines.push(row.join(sep));
      }

      const csvContent = lines.join('\n');
      return {
        filename: fileName,
        contentType: 'text/csv; charset=utf-8',
        content: csvContent,
      };
    } catch (error) {
      console.error('Ошибка экспорта в CSV:', error);
      throw error;
    }
  }

  // Экспорт JSON: формируем единый объект и сериализуем
  async exportToJSON(reviews: Review[], filename?: string): Promise<ExportResult> {
    try {
      const fileName = filename || `reviews_${Date.now()}.json`;
      const exportData = {
        exportDate: new Date().toISOString(),
        totalReviews: reviews.length,
        reviews,
      };
      const jsonContent = JSON.stringify(exportData, null, 2);
      return {
        filename: fileName,
        contentType: 'application/json; charset=utf-8',
        content: jsonContent,
      };
    } catch (error) {
      console.error('Ошибка экспорта в JSON:', error);
      throw error;
    }
  }
}
