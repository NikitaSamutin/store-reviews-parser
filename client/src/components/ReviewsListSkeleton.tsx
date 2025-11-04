import React from 'react';
import { ReviewSkeleton } from './ReviewSkeleton';

interface ReviewsListSkeletonProps {
  count?: number;
}

export const ReviewsListSkeleton: React.FC<ReviewsListSkeletonProps> = ({ count = 10 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ReviewSkeleton key={index} />
      ))}
    </div>
  );
};
