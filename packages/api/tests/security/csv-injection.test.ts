/**
 * CSV Injection tests - P2 Medium Priority
 * 
 * Проблема: escapeCsv не нейтрализует формулы Excel
 * Значения начинающиеся с =, +, -, @, \t, \r могут выполнить код в Excel
 */

import { describe, it, expect } from 'vitest';
import { ExportService } from '../../src/services/exportService.js';
import { Review } from '../../src/types/index.js';

describe('CSV Export Security - P2', () => {
  const exportService = new ExportService();

  const createReview = (content: string): Review => ({
    id: 'test-1',
    appName: 'Test App',
    store: 'apple',
    rating: 5,
    title: 'Test Title',
    content,
    author: 'Test Author',
    date: new Date('2025-01-01'),
    region: 'us',
    version: '1.0',
    helpful: 0,
  });

  describe('Formula injection prevention', () => {
    it('should neutralize values starting with =', async () => {
      const review = createReview('=HYPERLINK("http://evil.com","Click me")');
      const result = await exportService.exportToCSV([review]);
      
      // Должно содержать '= вместо просто =
      expect(result.content).toContain("'=HYPERLINK");
    });

    it('should neutralize values starting with +', async () => {
      const review = createReview('+cmd|calc');
      const result = await exportService.exportToCSV([review]);
      
      // Должно содержать '+ вместо просто +
      expect(result.content).toContain("'+cmd");
    });

    it('should neutralize values starting with -', async () => {
      const review = createReview('-1+1');
      const result = await exportService.exportToCSV([review]);
      
      // Должно быть нейтрализовано добавлением ' в начало
      // Проверяем что содержимое начинается с '
      expect(result.content).toContain("'-1+1");
    });

    it('should neutralize values starting with @', async () => {
      const review = createReview('@SUM(A1:A10)');
      const result = await exportService.exportToCSV([review]);
      
      // Должно содержать '@ вместо просто @
      expect(result.content).toContain("'@SUM");
    });

    it('should neutralize values starting with tab character', async () => {
      const review = createReview('\t=cmd|calc');
      const result = await exportService.exportToCSV([review]);
      
      // Tab в начале должен быть нейтрализован
      expect(result.content).toContain("'\t=cmd");
    });

    it('should neutralize values starting with carriage return', async () => {
      const review = createReview('\r=cmd|calc');
      const result = await exportService.exportToCSV([review]);
      
      // CR в начале должен быть нейтрализован
      expect(result.content).toContain("'\r=cmd");
    });
  });

  describe('Safe content should pass through', () => {
    it('should not modify normal text content', async () => {
      const review = createReview('This is a normal review with no special characters');
      const result = await exportService.exportToCSV([review]);
      
      expect(result.content).toContain('This is a normal review');
    });

    it('should handle content with = in the middle', async () => {
      const review = createReview('The price = $10, which is fair');
      const result = await exportService.exportToCSV([review]);
      
      // = в середине строки безопасен
      expect(result.content).toContain('price = $10');
    });

    it('should handle negative numbers in text', async () => {
      const review = createReview('Temperature dropped to -5 degrees');
      const result = await exportService.exportToCSV([review]);
      
      expect(result.content).toContain('-5 degrees');
    });
  });

  describe('Title field injection', () => {
    it('should neutralize formulas in title field', async () => {
      const review: Review = {
        ...createReview('Normal content'),
        title: '=IMPORTXML("http://evil.com/data.xml","//data")',
      };
      
      const result = await exportService.exportToCSV([review]);
      
      expect(result.content).not.toContain(';=IMPORTXML');
    });
  });

  describe('Author field injection', () => {
    it('should neutralize formulas in author field', async () => {
      const review: Review = {
        ...createReview('Normal content'),
        author: '=cmd|calc',
      };
      
      const result = await exportService.exportToCSV([review]);
      
      // Автор должен быть нейтрализован
      expect(result.content).toContain("'=cmd");
    });
  });
});
