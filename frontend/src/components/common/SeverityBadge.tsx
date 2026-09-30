import React from 'react'
import type { SeverityLevel } from '@/types'

interface SeverityBadgeProps {
  severity: SeverityLevel
  size?: 'sm' | 'md'
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  let badgeStyle = 'bg-[#1E2638] text-[#94A3B8] border-[#3D494C]'

  switch (severity) {
    case 'CRITICAL':
      badgeStyle = 'bg-[#93000A]/40 text-[#EF4444] border-[#EF4444]/40 font-bold'
      break
    case 'HIGH':
      badgeStyle = 'bg-[#78350F]/40 text-[#F59E0B] border-[#F59E0B]/40 font-semibold'
      break
    case 'MEDIUM':
      badgeStyle = 'bg-[#182030] text-[#06B6D4] border-[#06B6D4]/30'
      break
    case 'LOW':
      badgeStyle = 'bg-[#064E3B]/30 text-[#10B981] border-[#10B981]/30'
      break
  }

  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'

  return (
    <span className={`inline-flex items-center font-mono uppercase tracking-wider rounded border ${badgeStyle} ${sizeClasses}`}>
      {severity}
    </span>
  )
}
