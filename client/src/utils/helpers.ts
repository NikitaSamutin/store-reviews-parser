import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Утилита для объединения классов Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Форматирование даты
export function formatDate(date: Date | string, formatStr: string = 'dd.MM.yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Неверная дата';
    return format(dateObj, formatStr, { locale: ru });
  } catch (error) {
    return 'Неверная дата';
  }
}

// Форматирование относительной даты
export function formatRelativeDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Неверная дата';
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Сегодня';
    if (diffInDays === 1) return 'Вчера';
    if (diffInDays < 7) return `${diffInDays} дн. назад`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} нед. назад`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} мес. назад`;
    return `${Math.floor(diffInDays / 365)} г. назад`;
  } catch (error) {
    return 'Неверная дата';
  }
}

// Получение иконки рейтинга
export function getRatingStars(rating: number): string {
  const stars = '⭐'.repeat(Math.max(0, Math.min(5, rating)));
  const emptyStars = '☆'.repeat(5 - Math.max(0, Math.min(5, rating)));
  return stars + emptyStars;
}

// Получение цвета рейтинга
export function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-yellow-600';
  if (rating >= 2) return 'text-orange-600';
  return 'text-red-600';
}

// Получение иконки магазина
export function getStoreIcon(store: 'google' | 'apple'): string {
  return store === 'google' ? '🤖' : '🍎';
}

// Получение названия магазина
export function getStoreName(store: 'google' | 'apple'): string {
  return store === 'google' ? 'Google Play' : 'App Store';
}

// Сокращение текста
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Валидация email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Генерация случайного ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Дебаунс функции
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void; } {
  let timeoutId: ReturnType<typeof setTimeout>;

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debounced;
}

// Скачивание файла
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Получение размера файла в читаемом формате
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Проверка, является ли строка URL
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Получение первых букв для аватара
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
