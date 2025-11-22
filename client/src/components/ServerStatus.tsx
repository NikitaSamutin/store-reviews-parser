import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ServerStatusProps {
  isWaking: boolean;
}

export const ServerStatus: React.FC<ServerStatusProps> = ({ isWaking }) => {
  if (!isWaking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <LoadingSpinner size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Сервер просыпается...
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Это может занять до 30 секунд при первом запуске
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
