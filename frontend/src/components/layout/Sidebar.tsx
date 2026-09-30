import React from 'react'
import {
  LayoutDashboard,
  Receipt,
  ShieldAlert,
  Bot,
  Lock,
  AlertTriangle,
  Activity,
  Sliders,
  ShieldX,
} from 'lucide-react'
import { Logo } from '@/components/common/Logo'

export type NavTab =
  | 'overview'
  | 'transactions'
  | 'threat-detection'
  | 'agent-behavior'
  | 'data-protection'
  | 'alerts'
  | 'analytics'
  | 'settings'

interface SidebarProps {
  activeTab: NavTab
  setActiveTab: (tab: NavTab) => void
  activeAlertCount?: number
  activeThreatCount?: number
  onLockoutClick?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeAlertCount = 0,
  activeThreatCount = 0,
  onLockoutClick,
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    {
      id: 'transactions' as NavTab,
      label: 'Transactions',
      icon: Receipt,
      badge: (
        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#064E3B]/40 text-[#10B981] border border-[#10B981]/30">
          LIVE
        </span>
      ),
    },
    {
      id: 'threat-detection' as NavTab,
      label: 'Threat Detection',
      icon: ShieldAlert,
      badge: activeThreatCount > 0 ? (
        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#93000A]/40 text-[#EF4444] border border-[#EF4444]/30 font-bold">
          {activeThreatCount}
        </span>
      ) : undefined,
    },
    { id: 'agent-behavior' as NavTab, label: 'Agent Behavior', icon: Bot },
    {
      id: 'data-protection' as NavTab,
      label: 'Data Protection',
      icon: Lock,
      badge: (
        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#0566D9]/30 text-[#adc6ff] border border-[#adc6ff]/30">
          PAN-GUARD
        </span>
      ),
    },
    {
      id: 'alerts' as NavTab,
      label: 'Alerts',
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EF4444]"></span>
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#93000A]/40 text-[#EF4444] border border-[#EF4444]/30 font-bold">
            {activeAlertCount}
          </span>
        </div>
      ) : undefined,
    },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: Activity },
    { id: 'settings' as NavTab, label: 'Settings', icon: Sliders },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#051424] border-r border-[#1E2638] z-50 flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div className="flex flex-col">
        <div className="h-16 px-4 border-b border-[#1E2638] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#F1F5F9] tracking-tight font-sans text-base">
                  AegisFlow
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30">
                  v2.4-PROD
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider">
                AI Payment Security
              </span>
            </div>
          </div>
        </div>

        {/* Section title */}
        <div className="px-4 py-2 mt-2">
          <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider px-2">
            Navigation
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors font-sans text-xs ${
                  isActive
                    ? 'bg-[#1C2B3C] text-[#06B6D4] border-l-2 border-[#06B6D4] font-semibold'
                    : 'text-[#94A3B8] hover:bg-[#11151F] hover:text-[#F1F5F9]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#06B6D4]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Telemetry Card matching Stitch */}
      <div className="p-3 border-t border-[#1E2638] bg-[#07090E]/60 flex flex-col gap-2">
        <div className="p-2.5 rounded bg-[#0B0E14] border border-[#1E2638] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#64748B] uppercase">Agent Runtime</span>
            <span className="font-mono text-[10px] text-[#10B981] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
              14ms
            </span>
          </div>
          <span className="font-mono text-xs text-[#F1F5F9] truncate">
            FinCore-v4 / Calibrated SVC
          </span>
        </div>

        <div className="p-2.5 rounded bg-[#0B0E14] border border-[#1E2638] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#64748B] uppercase">Active Policy</span>
            <span className="font-mono text-[10px] text-[#10B981]">COMPLIANT</span>
          </div>
          <span className="font-mono text-xs text-[#06B6D4] truncate">
            GLOBAL-FIN-SEC-9
          </span>
        </div>

        <button
          onClick={onLockoutClick}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#7F1D1D]/20 border border-[#EF4444]/40 hover:bg-[#EF4444] hover:text-white rounded text-[#EF4444] transition-colors"
          type="button"
        >
          <ShieldX className="w-4 h-4" />
          <span className="font-mono text-[11px] tracking-wider uppercase font-bold">
            Security Lockout
          </span>
        </button>
      </div>
    </aside>
  )
}
