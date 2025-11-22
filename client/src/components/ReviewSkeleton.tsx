

export const ReviewSkeleton = () => {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
          <div className="h-5 bg-gray-300 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="space-y-3">
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
      </div>
      <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
  );
};
