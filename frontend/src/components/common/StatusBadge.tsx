import React from 'react'
import type { ActionType, TransactionStatus } from '@/types'

interface StatusBadgeProps {
  status: TransactionStatus | ActionType | string
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  let badgeStyle = 'bg-[#182030] text-[#94A3B8] border-[#1E2638]'

  switch (status) {
    case 'APPROVED':
    case 'ALLOW':
      badgeStyle = 'bg-[#064E3B]/30 text-[#10B981] border-[#10B981]/40 font-semibold'
      break
    case 'FLAGGED':
    case 'FLAG':
      badgeStyle = 'bg-[#78350F]/30 text-[#F59E0B] border-[#F59E0B]/40 font-semibold'
      break
    case 'BLOCKED':
    case 'BLOCK':
    case 'REJECTED':
      badgeStyle = 'bg-[#7F1D1D]/30 text-[#EF4444] border-[#EF4444]/40 font-bold'
      break
    case 'REDACT_AND_ALLOW':
      badgeStyle = 'bg-[#0566D9]/30 text-[#06B6D4] border-[#06B6D4]/40 font-semibold'
      break
    case 'PENDING':
      badgeStyle = 'bg-[#182030] text-[#3B82F6] border-[#3B82F6]/30'
      break
  }

  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded border ${badgeStyle} ${sizeClasses}`}>
      {status === 'APPROVED' && <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>}
      {status === 'BLOCKED' && <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]"></span>}
      {status === 'FLAGGED' && <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]"></span>}
      {status === 'REDACT_AND_ALLOW' && <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]"></span>}
      {status}
    </span>
  )
}
