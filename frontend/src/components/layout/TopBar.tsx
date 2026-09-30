import React, { useState } from 'react'
import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Play,
  Search,
  Terminal,
  User,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NotificationsPopover } from '@/components/layout/NotificationsPopover'

interface TopBarProps {
  isBackendConnected: boolean
  activeAlertCount?: number
  onOpenSimulation: () => void
  onOpenAgentConsole: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  onNavigateToTab?: (tab: any) => void
  onNavigateToHomepage?: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  isBackendConnected,
  activeAlertCount = 0,
  onOpenSimulation,
  onOpenAgentConsole,
  searchQuery,
  setSearchQuery,
  onNavigateToTab,
  onNavigateToHomepage,
}) => {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(activeAlertCount)

  const displayName = user?.full_name || user?.username || 'Elena Vance'
  const displayRole = user?.role || 'Lead AI SecOps Analyst'
  const displayEmail = user?.email || 'analyst@aegisflow.io'

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-[#051424]/95 backdrop-blur-md border-b border-[#1E2638] z-40 px-6 flex items-center justify-between gap-4">
      {/* Left breadcrumb & system telemetry */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#94A3B8]">
          <span className="text-[#64748B]">SOC</span>
          <span className="text-[#64748B]">/</span>
          <span className="text-[#F1F5F9] font-medium">Observability</span>
        </div>

        <div className="h-4 w-px bg-[#1E2638]"></div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0B0E14] border border-[#1E2638] font-mono text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
          <span className="text-[#10B981] font-bold">SYSTEM OPERATIONAL</span>
          <span className="text-[#64748B]">|</span>
          <span className="text-[#94A3B8]">Live Engine</span>
        </div>

        {/* Backend Online/Offline Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[11px] border ${
            isBackendConnected
              ? 'bg-[#064E3B]/20 text-[#10B981] border-[#10B981]/40'
              : 'bg-[#7F1D1D]/20 text-[#EF4444] border-[#EF4444]/40 animate-pulse'
          }`}
          title={isBackendConnected ? 'Connected to http://127.0.0.1:8000' : 'Backend is unreachable'}
        >
          <span className={`h-2 w-2 rounded-full ${isBackendConnected ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></span>
          <span className="font-bold tracking-wider">
            {isBackendConnected ? 'BACKEND CONNECTED' : 'BACKEND OFFLINE'}
          </span>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="flex-1 max-w-lg mx-auto">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3 text-[#64748B] w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions, threat signatures, or rule IDs..."
            className="w-full bg-[#0B0E14] border border-[#1E2638] rounded-md pl-9 pr-10 py-1.5 font-sans text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#06B6D4] transition-colors"
          />
          <div className="absolute right-2.5 px-1.5 py-0.5 rounded bg-[#1C2B3C] border border-[#1E2638] text-[#94A3B8] font-mono text-[10px]">
            /
          </div>
        </div>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Simulator Trigger Button */}
        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#11151F] hover:bg-[#182030] text-[#06B6D4] border border-[#06B6D4]/30 font-mono text-xs transition-colors"
          title="Run synthetic traffic or red-team penetration test"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Simulate</span>
        </button>

        {/* Agent Interactive Test Console Button */}
        <button
          onClick={onOpenAgentConsole}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#06B6D4] hover:bg-[#4CD7F6] text-[#07090E] font-sans font-semibold text-xs transition-colors shadow-sm"
          title="Interactive prompt evaluator for autonomous payment agent"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Agent Console</span>
        </button>

        {/* Tier badge */}
        <div className="hidden xl:block px-2 py-0.5 rounded bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-[#06B6D4] font-mono text-[10px] font-semibold tracking-wider">
          TIER-3 SOC
        </div>

        {/* Notifications Button & Functional Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen)
              setIsProfileMenuOpen(false)
            }}
            className={`p-1.5 rounded transition-colors relative ${
              isNotificationsOpen ? 'bg-[#182030] text-[#06B6D4]' : 'hover:bg-[#11151F] text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
            title="Open SOC Security Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EF4444] text-white font-mono text-[9px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Popover */}
          <NotificationsPopover
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onNavigateToTab={onNavigateToTab}
            onUnreadCountChange={setUnreadCount}
          />
        </div>

        <div className="h-5 w-px bg-[#1E2638]"></div>

        {/* Profile Avatar & Account Dropdown Menu */}
        <div className="relative">
          {isAuthenticated ? (
            <div
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen)
                setIsNotificationsOpen(false)
              }}
              className="flex items-center gap-2 pl-1 cursor-pointer p-1 rounded-lg hover:bg-[#11151F] transition-colors"
            >
              <div className="relative">
                <img
                  alt="Analyst Avatar"
                  src="/profile.png"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                  className="w-8 h-8 rounded-full object-cover border border-[#1E2638]"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#10B981] border-2 border-[#051424]"></span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#F1F5F9] leading-tight font-sans truncate max-w-[120px]">
                  {displayName}
                </span>
                <span className="text-[10px] font-mono text-[#94A3B8] leading-tight truncate max-w-[120px]">
                  {displayRole}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden lg:block" />
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-3 py-1.5 rounded-lg bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-[#06B6D4] font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Profile Dropdown Popover */}
          {isProfileMenuOpen && isAuthenticated && (
            <div className="absolute right-0 top-12 w-64 bg-[#0B0E14] border border-[#1E2638] rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn font-sans p-2 space-y-1">
              <div className="p-2.5 bg-[#11151F] border border-[#1E2638]/50 rounded-lg">
                <div className="text-xs font-bold text-[#F1F5F9] truncate">{displayName}</div>
                <div className="text-[11px] font-mono text-[#94A3B8] truncate">{displayEmail}</div>
                <div className="mt-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#06B6D4]/15 text-[#06B6D4] inline-block font-semibold">
                  {displayRole}
                </div>
              </div>

              <button
                onClick={() => {
                  openAuthModal('register')
                  setIsProfileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs font-mono text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] rounded-lg transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Register New Account</span>
              </button>

              <button
                onClick={() => {
                  openAuthModal('login')
                  setIsProfileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs font-mono text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] rounded-lg transition-colors flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Switch Account</span>
              </button>

              {onNavigateToHomepage && (
                <button
                  onClick={() => {
                    onNavigateToHomepage()
                    setIsProfileMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-mono text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] rounded-lg transition-colors flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>View Homepage Portal</span>
                </button>
              )}

              <div className="h-px bg-[#1E2638] my-1"></div>

              <button
                onClick={() => {
                  logout()
                  setIsProfileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs font-mono text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out / Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
