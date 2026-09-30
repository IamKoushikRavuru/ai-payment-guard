import React from 'react'

interface LoadingSkeletonProps {
  rows?: number
  height?: string
  className?: string
  variant?: 'kpi' | 'card' | 'table'
  count?: number
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 4,
  height = 'h-10',
  className = '',
  variant,
  count = 4,
}) => {
  if (variant === 'kpi') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="p-4 bg-[#11151F] border border-[#1E2638] rounded-xl h-24 flex flex-col justify-between"
          >
            <div className="h-3 w-1/3 bg-[#182030] rounded" />
            <div className="h-6 w-1/2 bg-[#182030] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`p-5 bg-[#0B0E14] border border-[#1E2638] rounded-xl animate-pulse space-y-4 ${className}`}>
        <div className="h-4 w-1/4 bg-[#182030] rounded" />
        <div className="h-48 w-full bg-[#11151F] border border-[#1E2638]/50 rounded-lg" />
      </div>
    )
  }

  const effectiveRows = count || rows

  return (
    <div className={`w-full space-y-2.5 animate-pulse ${className}`}>
      {Array.from({ length: effectiveRows }).map((_, idx) => (
        <div
          key={idx}
          className={`w-full bg-[#182030]/60 border border-[#1E2638] rounded-lg ${height}`}
        />
      ))}
    </div>
  )
}
