import { createObjectCsvWriter } from 'csv-writer';
import { Review } from '../types';
import path from 'path';
import fs from 'fs';

export class ExportService {
  async exportToCSV(reviews: Review[], filename?: string): Promise<string> {
    try {
      const exportDir = path.join(__dirname, '../../exports');
      
      // Создаём директорию если её нет
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const fileName = filename || `reviews_${Date.now()}.csv`;
      const filePath = path.join(exportDir, fileName);

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'appName', title: 'Название приложения' },
          { id: 'store', title: 'Магазин' },
          { id: 'rating', title: 'Рейтинг' },
          { id: 'title', title: 'Заголовок' },
          { id: 'content', title: 'Содержание' },
          { id: 'author', title: 'Автор' },
          { id: 'date', title: 'Дата' },
          { id: 'region', title: 'Регион' },
          { id: 'version', title: 'Версия' },
          { id: 'helpful', title: 'Полезность' }
        ],
        encoding: 'utf8'
      });

      const formattedReviews = reviews.map(review => ({
        ...review,
        store: review.store === 'google' ? 'Google Play' : 'App Store',
        date: review.date.toLocaleDateString('ru-RU')
      }));

      await csvWriter.writeRecords(formattedReviews);
      return filePath;
    } catch (error) {
      console.error('Ошибка экспорта в CSV:', error);
      throw error;
    }
  }

  async exportToJSON(reviews: Review[], filename?: string): Promise<string> {
    try {
      const exportDir = path.join(__dirname, '../../exports');
      
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const fileName = filename || `reviews_${Date.now()}.json`;
      const filePath = path.join(exportDir, fileName);

      const exportData = {
        exportDate: new Date().toISOString(),
        totalReviews: reviews.length,
        reviews: reviews
      };

      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8');
      return filePath;
    } catch (error) {
      console.error('Ошибка экспорта в JSON:', error);
      throw error;
    }
  }

  getExportedFiles(): string[] {
    try {
      const exportDir = path.join(__dirname, '../../exports');
      
      if (!fs.existsSync(exportDir)) {
        return [];
      }

      return fs.readdirSync(exportDir)
        .filter(file => file.endsWith('.csv') || file.endsWith('.json'))
        .map(file => path.join(exportDir, file));
    } catch (error) {
      console.error('Ошибка получения списка экспортированных файлов:', error);
      return [];
    }
  }

  deleteExportedFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      return false;
    }
  }
}
