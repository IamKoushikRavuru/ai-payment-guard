import React from 'react'
import { X } from 'lucide-react'

interface DetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  badge?: React.ReactNode
  children: React.ReactNode
  width?: string
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  width = 'max-w-xl',
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div
          className={`w-screen ${width} bg-[#11151F] border-l border-[#1E2638] shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out`}
        >
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-[#1E2638] bg-[#0B0E14] flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-[#F1F5F9] font-sans">{title}</h3>
                {badge}
              </div>
              {subtitle && <span className="font-mono text-xs text-[#94A3B8]">{subtitle}</span>}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
