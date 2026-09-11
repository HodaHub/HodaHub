import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200/80 p-3.5 flex flex-col h-full shadow-sm">
      {/* Shimmer Image Box */}
      <div className="w-full aspect-square rounded-md shimmer-bg mb-3" />

      {/* Shimmer Title lines */}
      <div className="space-y-2 mb-3">
        <div className="h-4 rounded shimmer-bg w-5/6" />
        <div className="h-4 rounded shimmer-bg w-3/5" />
      </div>

      {/* Shimmer Badges */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-12 rounded shimmer-bg" />
        <div className="h-4 w-20 rounded shimmer-bg" />
      </div>

      {/* Shimmer Price */}
      <div className="mt-auto pt-2 flex items-center justify-between">
        <div className="h-6 w-24 rounded shimmer-bg" />
        <div className="h-8 w-20 rounded-md shimmer-bg" />
      </div>
    </div>
  );
};
