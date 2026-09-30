import React from 'react'

export interface MetricCardProps {
  label?: string
  title?: string
  value: string | number
  unit?: string
  delta?: string
  deltaType?: 'positive' | 'negative' | 'neutral' | 'urgent'
  subtext?: string
  subValue?: string
  badgeText?: string
  badgeVariant?: 'cyan' | 'green' | 'amber' | 'red'
  icon?: React.ReactNode
  sparklineVariant?: 'emerald' | 'crimson' | 'cyan' | 'amber' | 'progress'
  progressValue?: number
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  title,
  value,
  unit,
  delta,
  deltaType = 'neutral',
  subtext,
  subValue,
  badgeText,
  badgeVariant = 'cyan',
  icon,
  sparklineVariant,
  progressValue,
}) => {
  const displayLabel = label || title || ''
  const displaySub = subtext || subValue

  const badgeStyles = {
    cyan: 'text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/30',
    green: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
    amber: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
    red: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30',
  }[badgeVariant]

  return (
    <div className="p-3.5 bg-[#11151F] border border-[#1E2638] rounded-xl flex flex-col justify-between shadow-sm hover:border-[#2E3A52] hover:bg-[#182030]/60 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase text-[#94A3B8] tracking-wider truncate">
          {displayLabel}
        </span>
        {icon && <span className="text-[#64748B] shrink-0">{icon}</span>}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl lg:text-[28px] font-bold text-[#F1F5F9] tracking-tight font-sans"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </span>
          {unit && <span className="text-xs font-mono text-[#64748B]">{unit}</span>}
        </div>

        {delta && (
          <span
            className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              deltaType === 'positive'
                ? 'text-[#10B981] bg-[#064E3B]/30'
                : deltaType === 'negative'
                ? 'text-[#EF4444] bg-[#7F1D1D]/30'
                : deltaType === 'urgent'
                ? 'text-[#EF4444] bg-[#93000A]/40 animate-pulse'
                : 'text-[#94A3B8] bg-[#1E2638]'
            }`}
          >
            {delta}
          </span>
        )}

        {badgeText && !delta && (
          <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeStyles}`}>
            {badgeText}
          </span>
        )}
      </div>

      {progressValue !== undefined ? (
        <div className="mt-3">
          <div className="w-full bg-[#1E2638] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressValue > 70 ? 'bg-[#EF4444]' : progressValue > 30 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
            />
          </div>
          {displaySub && <span className="text-[10px] font-mono text-[#64748B] mt-1 block">{displaySub}</span>}
        </div>
      ) : displaySub ? (
        <div className="mt-2 text-[11px] font-mono text-[#64748B] truncate">
          {displaySub}
        </div>
      ) : null}
    </div>
  )
}
