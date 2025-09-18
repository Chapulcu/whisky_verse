import React from 'react'

interface WhiskySkeletonProps {
  viewMode?: 'grid' | 'list'
  gridColumns?: 2 | 3 | 4 | 5 | 6
  count?: number
}

// Individual skeleton card component
const SkeletonCard: React.FC<{ viewMode: 'grid' | 'list' }> = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center gap-6">
          {/* Image skeleton */}
          <div className="w-32 h-32 bg-slate-300 dark:bg-slate-700 rounded-lg flex-shrink-0"></div>

          {/* Content skeleton */}
          <div className="flex-1 space-y-3">
            {/* Title */}
            <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-md w-3/4"></div>
            {/* Type */}
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-md w-1/3"></div>
            {/* Info row */}
            <div className="flex items-center gap-4">
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-md w-24"></div>
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-md w-16"></div>
            </div>
            {/* Description */}
            <div className="space-y-2">
              <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded-md w-full"></div>
              <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded-md w-2/3"></div>
            </div>
          </div>

          {/* Actions skeleton */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="w-11 h-11 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
            <div className="w-11 h-11 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
            <div className="w-11 h-11 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view skeleton
  return (
    <div className="card group animate-pulse p-6">
      {/* Image skeleton */}
      <div className="relative h-80 md:h-96 lg:h-[420px] mb-6 rounded-xl bg-slate-300 dark:bg-slate-700">
        {/* Quick Actions skeleton */}
        <div className="absolute top-3 right-3 flex gap-2">
          <div className="w-8 h-8 bg-slate-400 dark:bg-slate-600 rounded-full"></div>
          <div className="w-8 h-8 bg-slate-400 dark:bg-slate-600 rounded-full"></div>
          <div className="w-8 h-8 bg-slate-400 dark:bg-slate-600 rounded-full"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-4 p-1">
        <div>
          {/* Title */}
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded-md mb-2 w-3/4"></div>
          {/* Type badge */}
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-full w-24 inline-block"></div>
        </div>

        {/* Info sections */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-lg flex-1">
            <div className="w-5 h-5 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-20"></div>
          </div>
          <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-lg flex-1">
            <div className="w-5 h-5 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-12"></div>
          </div>
        </div>

        {/* Rating skeleton (sometimes visible) */}
        {Math.random() > 0.5 && (
          <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-lg w-fit">
            <div className="w-4 h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-16"></div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main skeleton component
export const WhiskySkeleton: React.FC<WhiskySkeletonProps> = ({
  viewMode = 'grid',
  gridColumns = 3,
  count = 12
}) => {
  const gridColumnClasses = {
    2: 'sm:grid-cols-1 md:grid-cols-2',
    3: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
  }

  const skeletonCards = Array.from({ length: count }, (_, index) => (
    <SkeletonCard key={index} viewMode={viewMode} />
  ))

  if (viewMode === 'list') {
    return <div className="space-y-4">{skeletonCards}</div>
  }

  return (
    <div className={`grid grid-cols-1 ${gridColumnClasses[gridColumns]} gap-8`}>
      {skeletonCards}
    </div>
  )
}

// Minimal loading skeleton for quick transitions
export const WhiskySkeletonMini: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex flex-col items-center space-y-4 animate-pulse">
      <div className="w-16 h-16 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
      <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-32"></div>
      <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-24"></div>
    </div>
  </div>
)

export default WhiskySkeleton