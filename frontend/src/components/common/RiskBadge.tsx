import React from 'react'

interface RiskBadgeProps {
  score: number
  showBeacon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, showBeacon = true, size = 'md' }) => {
  const roundedScore = Math.round(score * 10) / 10

  let colorClasses = 'text-[#10B981] bg-[#064E3B]/25 border-[#10B981]/30'
  let isCritical = false

  if (score >= 70.0) {
    colorClasses = 'text-[#EF4444] bg-[#7F1D1D]/25 border-[#EF4444]/30'
    isCritical = true
  } else if (score >= 30.0) {
    colorClasses = 'text-[#F59E0B] bg-[#78350F]/25 border-[#F59E0B]/30'
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  }[size]

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-bold rounded-full border ${colorClasses} ${sizeClasses}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {isCritical && showBeacon && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EF4444]"></span>
        </span>
      )}
      {roundedScore}/100
    </span>
  )
}
