import React from 'react';
import { Smartphone, Star, Bug, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const Header: React.FC<{ onOpenLogs?: () => void }> = ({ onOpenLogs }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Парсер отзывов
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                App Store & Google Play
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Анализ отзывов приложений</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Онлайн</span>
            </div>

            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm"
              title={theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onOpenLogs}
              className="btn btn-ghost btn-sm"
            >
              <Bug className="w-4 h-4 mr-2" /> Логи
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
