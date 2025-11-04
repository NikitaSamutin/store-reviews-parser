import React from 'react';
import { Smartphone, Star, Bug } from 'lucide-react';

export const Header: React.FC<{ onOpenLogs?: () => void }> = ({ onOpenLogs }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Парсер отзывов
              </h1>
              <p className="text-sm text-gray-500">
                App Store & Google Play
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Анализ отзывов приложений</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Онлайн</span>
            </div>

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
