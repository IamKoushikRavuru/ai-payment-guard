import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import { alertsApi } from '@/api/alerts'
import { securityApi } from '@/api/security'
import { useWebSocket } from '@/context/WebSocketContext'
import type { Alert, SecurityEvent } from '@/types'

export interface NotificationItem {
  id: string
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  timestamp: string
  type: 'ALERT' | 'THREAT' | 'DLP' | 'SYSTEM'
  read: boolean
}

interface NotificationsPopoverProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToTab?: (tab: string) => void
  onUnreadCountChange?: (count: number) => void
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onUnreadCountChange,
}) => {
  const { lastEvent } = useWebSocket()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch initial notifications from alerts & recent security events
  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const [alertsRes, eventsRes] = await Promise.all([
        alertsApi.list({ limit: 10, is_resolved: false }).catch(() => ({ items: [], alerts: [] })),
        securityApi.listEvents({ limit: 10 }).catch(() => ({ items: [], events: [] })),
      ])

      const alertItems = (alertsRes.items || alertsRes.alerts || []).map((a: Alert) => ({
        id: a.id,
        title: a.title || a.alert_type || 'Security Alert',
        description: a.description || a.message || 'Triggered alert requiring triage',
        severity: (a.severity || 'HIGH') as any,
        timestamp: a.created_at || a.timestamp || new Date().toISOString(),
        type: 'ALERT' as const,
        read: false,
      }))

      const eventItems = (eventsRes.items || eventsRes.events || []).slice(0, 5).map((e: SecurityEvent) => ({
        id: e.id,
        title: `${e.event_type.replace(/_/g, ' ')}`,
        description: e.description || `Severity: ${e.severity}. Action: ${e.action}`,
        severity: (e.severity || 'MEDIUM') as any,
        timestamp: e.created_at || e.timestamp || new Date().toISOString(),
        type: 'THREAT' as const,
        read: false,
      }))

      const combined = [...alertItems, ...eventItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setNotifications(combined)
      if (onUnreadCountChange) {
        onUnreadCountChange(combined.filter((n) => !n.read).length)
      }
    } catch (err) {
      console.error('Failed to load notifications', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  // Listen for real-time WebSocket events and prepend
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'SECURITY_EVENT') {
      const newNotif: NotificationItem = {
        id: lastEvent.event_id || `notif_${Date.now()}`,
        title: lastEvent.event_type?.replace(/_/g, ' ') || 'New Threat Event',
        description: lastEvent.description || `Action: ${lastEvent.action}. Risk: ${lastEvent.risk_score}`,
        severity: (lastEvent.severity || 'HIGH') as any,
        timestamp: lastEvent.timestamp || new Date().toISOString(),
        type: 'THREAT',
        read: false,
      }
      setNotifications((prev) => [newNotif, ...prev])
    }
  }, [lastEvent])

  // Update unread count
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read).length
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount)
    }
  }, [notifications, onUnreadCountChange])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const markItemRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="absolute right-0 top-12 w-96 max-w-[90vw] bg-[#0B0E14] border border-[#1E2638] rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn font-sans">
      {/* Popover Header */}
      <div className="p-3.5 border-b border-[#1E2638] flex items-center justify-between bg-[#11151F]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#06B6D4]" />
          <h3 className="text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider font-mono">
            Security Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-[10px] font-bold text-white font-mono">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="p-1 text-[#94A3B8] hover:text-[#06B6D4] rounded transition-colors text-[11px] font-mono flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="p-1 text-[#94A3B8] hover:text-[#EF4444] rounded transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-[#64748B] hover:text-[#F1F5F9] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-[#1E2638]/50">
        {notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto opacity-75" />
            <p className="text-xs text-[#94A3B8] font-mono">No new security notifications</p>
            <p className="text-[11px] text-[#64748B]">All autonomous transactions & pipelines clear</p>
          </div>
        ) : (
          notifications.map((item) => {
            const isCrit = item.severity === 'CRITICAL'
            const isHigh = item.severity === 'HIGH'
            const sevColor = isCrit ? 'text-[#EF4444]' : isHigh ? 'text-[#F59E0B]' : 'text-[#06B6D4]'
            const sevBg = isCrit ? 'bg-[#EF4444]/10 border-[#EF4444]/30' : isHigh ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'bg-[#06B6D4]/10 border-[#06B6D4]/30'

            return (
              <div
                key={item.id}
                onClick={() => markItemRead(item.id)}
                className={`p-3 transition-colors hover:bg-[#11151F]/60 cursor-pointer ${
                  item.read ? 'opacity-65' : 'bg-[#11151F]/25'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${sevBg} ${sevColor}`}>
                      {item.severity}
                    </span>
                    <span className="text-xs font-semibold text-[#F1F5F9] truncate max-w-[180px]">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8] font-mono line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#64748B]">{item.id}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      markItemRead(item.id)
                      if (onNavigateToTab) {
                        onNavigateToTab(item.type === 'ALERT' ? 'alerts' : 'threat-detection')
                      }
                      onClose()
                    }}
                    className="text-[#06B6D4] hover:underline flex items-center gap-1"
                  >
                    <span>View {item.type === 'ALERT' ? 'Alert' : 'Forensics'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2.5 border-t border-[#1E2638] bg-[#11151F]/60 text-center">
          <button
            onClick={() => {
              if (onNavigateToTab) onNavigateToTab('alerts')
              onClose()
            }}
            className="text-xs font-mono text-[#06B6D4] hover:underline"
          >
            Open Full Alert Center →
          </button>
        </div>
      )}
    </div>
  )
}
