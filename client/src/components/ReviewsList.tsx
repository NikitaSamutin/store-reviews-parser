import React from 'react';
import { Star, Calendar, MapPin, Package } from 'lucide-react';
import { Review } from '@/types';
import { 
  formatRelativeDate, 
  getRatingStars, 
  getRatingColor, 
  getStoreIcon, 
  getStoreName, 
  truncateText,
  getInitials 
} from '@/utils/helpers';
import { LoadingSpinner } from './LoadingSpinner';

interface ReviewsListProps {
  reviews: Review[];
  isLoading?: boolean;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ 
  reviews, 
  isLoading = false 
}) => {
  if (reviews.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Отзывы не найдены</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">Загружаем ещё отзывы...</span>
        </div>
      )}
    </div>
  );
};

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Заголовок отзыва */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Аватар автора */}
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">
              {getInitials(review.author)}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900">{review.author}</h3>
              <span className="text-lg">{getStoreIcon(review.store)}</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatRelativeDate(review.date)}</span>
              </div>
              
              {review.region && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{review.region.toUpperCase()}</span>
                </div>
              )}
              
              {review.version && (
                <div className="flex items-center space-x-1">
                  <Package className="w-4 h-4" />
                  <span>v{review.version}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Рейтинг */}
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${getRatingColor(review.rating)}`}>
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold">{review.rating}</span>
          </div>
          <div className="text-lg">
            {getRatingStars(review.rating)}
          </div>
        </div>
      </div>

      {/* Заголовок отзыва (если есть) */}
      {review.title && review.title.trim() && (
        <h4 className="font-semibold text-gray-900 mb-3 text-lg">
          {review.title}
        </h4>
      )}

      {/* Содержание отзыва */}
      <div className="text-gray-700 leading-relaxed mb-4">
        <ReviewContent content={review.content} />
      </div>

      {/* Дополнительная информация */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>{getStoreName(review.store)}</span>
          <span>•</span>
          <span>{review.appName}</span>
        </div>

        {review.helpful && review.helpful > 0 && (
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <span>👍</span>
            <span>{review.helpful}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface ReviewContentProps {
  content: string;
}

const ReviewContent: React.FC<ReviewContentProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const maxLength = 300;
  const shouldTruncate = content.length > maxLength;

  if (!shouldTruncate) {
    return <p>{content}</p>;
  }

  return (
    <div>
      <p>
        {isExpanded ? content : truncateText(content, maxLength)}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 focus:outline-none"
      >
        {isExpanded ? 'Свернуть' : 'Показать полностью'}
      </button>
    </div>
  );
};
