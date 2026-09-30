import React, { useState, useEffect, useCallback } from 'react'
import { WebSocketProvider, useWebSocket } from '@/context/WebSocketContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AuthModal } from '@/components/auth/AuthModal'
import { HomePage } from '@/pages/HomePage'
import { Sidebar, NavTab } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { OverviewPage } from '@/pages/OverviewPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { ThreatDetectionPage } from '@/pages/ThreatDetectionPage'
import { AgentBehaviorPage } from '@/pages/AgentBehaviorPage'
import { DataProtectionPage } from '@/pages/DataProtectionPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SimulationModal } from '@/components/simulation/SimulationModal'
import { AgentChatDrawer } from '@/components/simulation/AgentChatDrawer'
import { systemApi } from '@/api/system'
import { alertsApi } from '@/api/alerts'
import { securityApi } from '@/api/security'
import { X, AlertTriangle } from 'lucide-react'

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [showHomepageView, setShowHomepageView] = useState(false)
  const [activeTab, setActiveTab] = useState<NavTab>('overview')
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSimulationOpen, setIsSimulationOpen] = useState(false)
  const [isAgentConsoleOpen, setIsAgentConsoleOpen] = useState(false)
  const [activeAlertCount, setActiveAlertCount] = useState(0)
  const [activeThreatCount, setActiveThreatCount] = useState(0)

  // Real-time banner alert on WebSocket events
  const { lastEvent } = useWebSocket()
  const [recentNotification, setRecentNotification] = useState<{
    id: string
    title: string
    severity: string
    timestamp: string
  } | null>(null)

  // Check backend health & counts
  const checkHealthAndCounts = useCallback(async () => {
    try {
      await systemApi.getHealth()
      setIsBackendConnected(true)
    } catch {
      setIsBackendConnected(false)
    }

    try {
      const [alertsRes, threatsRes] = await Promise.all([
        alertsApi.list({ is_resolved: false, limit: 1 }),
        securityApi.listEvents({ limit: 1 }),
      ])
      setActiveAlertCount(alertsRes.active_count || (alertsRes.items ? alertsRes.items.filter(a => !a.is_resolved).length : 0))
      setActiveThreatCount(threatsRes.total || (threatsRes.items ? threatsRes.items.length : 0))
    } catch {
      // Backend may be offline or starting up
    }
  }, [])

  useEffect(() => {
    checkHealthAndCounts()
    const interval = setInterval(checkHealthAndCounts, 15000)
    return () => clearInterval(interval)
  }, [checkHealthAndCounts])

  // Listen for real-time WebSocket events and display notification toast
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'SECURITY_EVENT' && lastEvent.severity) {
      if (lastEvent.severity === 'CRITICAL' || lastEvent.severity === 'HIGH') {
        setRecentNotification({
          id: lastEvent.event_id || `evt_${Date.now()}`,
          title: lastEvent.event_type || 'CRITICAL_SECURITY_ALERT',
          severity: lastEvent.severity,
          timestamp: new Date().toLocaleTimeString(),
        })
        setActiveThreatCount((prev) => prev + 1)
        setActiveAlertCount((prev) => prev + 1)
      }
    }
  }, [lastEvent])

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewPage
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )
      case 'transactions':
        return <TransactionsPage />
      case 'threat-detection':
        return <ThreatDetectionPage />
      case 'agent-behavior':
        return <AgentBehaviorPage />
      case 'data-protection':
        return <DataProtectionPage />
      case 'alerts':
        return <AlertsPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <OverviewPage />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center text-[#F1F5F9] font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#06B6D4]/20 border-t-[#06B6D4] animate-spin" />
          <span className="text-xs text-[#94A3B8] tracking-widest uppercase">
            INITIALIZING AEGISFLOW RUNTIME...
          </span>
        </div>
      </div>
    )
  }

  // Gatekeeper: Unauthenticated users are strictly barred from dashboard access
  if (!isAuthenticated || showHomepageView) {
    return (
      <>
        <HomePage onEnterDashboard={() => setShowHomepageView(false)} />
        <AuthModal />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F1F5F9] font-sans antialiased selection:bg-[#06B6D4]/30 selection:text-[#06B6D4]">
      {/* Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertCount={activeAlertCount}
        activeThreatCount={activeThreatCount}
        onLockoutClick={() => setIsAgentConsoleOpen(true)}
      />

      {/* Fixed TopBar */}
      <TopBar
        isBackendConnected={isBackendConnected}
        activeAlertCount={activeAlertCount}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onOpenAgentConsole={() => setIsAgentConsoleOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        onNavigateToHomepage={() => setShowHomepageView(true)}
      />

      {/* Main Content Area */}
      <main className="ml-64 pt-20 pb-12 px-6 lg:px-8 max-w-[1720px]">
        {/* Real-time incident banner toast */}
        {recentNotification && (
          <div className="mb-6 p-4 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 backdrop-blur-md flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-[#EF4444]/20 text-[#EF4444] animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase text-[#EF4444] px-1.5 py-0.5 rounded bg-[#EF4444]/20">
                    REAL-TIME {recentNotification.severity}
                  </span>
                  <h4 className="text-sm font-semibold text-[#F1F5F9]">
                    {recentNotification.title}
                  </h4>
                </div>
                <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                  Interception confirmed at {recentNotification.timestamp}. Audit ID: {recentNotification.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('threat-detection')
                  setRecentNotification(null)
                }}
                className="px-3 py-1.5 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-medium rounded-lg text-xs transition-colors"
              >
                Inspect Threat
              </button>
              <button
                onClick={() => setRecentNotification(null)}
                className="p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Component */}
        {renderActiveTab()}
      </main>

      {/* Global Interactive Simulation Modal */}
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onSimulationComplete={() => {
          checkHealthAndCounts()
        }}
      />

      {/* Global Autonomous Agent Test Console Drawer */}
      <AgentChatDrawer
        isOpen={isAgentConsoleOpen}
        onClose={() => setIsAgentConsoleOpen(false)}
      />

      {/* Global User Authentication Modal (Login / Register / Switch Account) */}
      <AuthModal />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <AppContent />
      </WebSocketProvider>
    </AuthProvider>
  )
}
