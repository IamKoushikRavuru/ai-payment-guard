import React from 'react'
import { ShieldCheck, RefreshCw } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  onRetry?: () => void
  actionText?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Detected',
  description = 'No matching records found in this operational window.',
  icon,
  onRetry,
  actionText = 'Refresh Feed',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#0B0E14] border border-[#1E2638] rounded-xl text-center">
      <div className="p-3 bg-[#11151F] border border-[#1E2638] rounded-full text-[#06B6D4] mb-3">
        {icon || <ShieldCheck className="w-8 h-8 text-[#10B981]" />}
      </div>
      <h4 className="font-bold text-[#F1F5F9] text-base mb-1 font-sans">{title}</h4>
      <p className="text-xs text-[#94A3B8] font-mono max-w-sm mb-4">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#182030] hover:bg-[#1E2638] text-xs font-mono text-[#06B6D4] border border-[#06B6D4]/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  )
}
