import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { alertsApi } from '@/api/alerts'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { MetricCard } from '@/components/common/MetricCard'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import type { Alert } from '@/types'

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('ALL')

  // Resolution modal state
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const fetchAlerts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await alertsApi.list({ limit: 100 })
      const rawAlerts: Alert[] = res.items || res.alerts || []
      setAlerts(rawAlerts)
    } catch (err: any) {
      console.error('Failed to load alerts', err)
      setError(err?.message || 'Failed to connect to alerts API.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAlert) return

    setIsResolving(true)
    try {
      await alertsApi.resolve(selectedAlert.id, {
        resolved_by: 'soc_analyst',
        resolution_notes: resolutionNotes || 'Investigated by SOC analyst and verified mitigated.',
      })
      setActionMessage(`Alert ${selectedAlert.id} successfully marked as RESOLVED.`)
      // Update local alerts list
      setAlerts((prev) =>
        prev.map((a) => (a.id === selectedAlert.id ? { ...a, is_resolved: true } : a))
      )
      setSelectedAlert(null)
      setResolutionNotes('')
    } catch (err: any) {
      console.error('Failed to resolve alert', err)
      setError(err?.message || `Failed to resolve alert ${selectedAlert.id}`)
    } finally {
      setIsResolving(false)
    }
  }

  // Filter calculations
  const filteredAlerts = alerts.filter((alert) => {
    const textMsg = alert.description || alert.message || ''
    const titleType = alert.title || alert.alert_type || ''
    const agentOrigin = alert.agent_id || alert.security_event_id || ''

    const matchesSearch =
      alert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      textMsg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agentOrigin.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSeverity =
      severityFilter === 'ALL' || alert.severity.toUpperCase() === severityFilter

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'UNRESOLVED' && !alert.is_resolved) ||
      (statusFilter === 'RESOLVED' && alert.is_resolved)

    return matchesSearch && matchesSeverity && matchesStatus
  })

  const totalCount = alerts.length
  const unresolvedCritical = alerts.filter((a) => !a.is_resolved && a.severity === 'CRITICAL').length
  const unresolvedHigh = alerts.filter((a) => !a.is_resolved && a.severity === 'HIGH').length
  const resolvedCount = alerts.filter((a) => a.is_resolved).length

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#06B6D4]" />
            Alert Center
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 font-mono">
            Autonomous agent anomaly alerts, escalation triggers & forensic incident resolution
          </p>
        </div>
        <div className="flex items-center gap-3">
          {actionMessage && (
            <div className="px-3 py-1.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg text-xs text-[#10B981] flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {actionMessage}
            </div>
          )}
          <button
            onClick={fetchAlerts}
            className="px-3 py-1.5 bg-[#11151F] border border-[#1E2638] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#06B6D4]/50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Alerts
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Triggered Alerts"
          value={totalCount.toString()}
          badgeText="All Time"
          badgeVariant="cyan"
          icon={<Bell className="w-5 h-5 text-[#06B6D4]" />}
        />
        <MetricCard
          label="Critical Unresolved"
          value={unresolvedCritical.toString()}
          subtext="Immediate action required"
          badgeText={unresolvedCritical > 0 ? 'Urgent' : 'Clear'}
          badgeVariant={unresolvedCritical > 0 ? 'red' : 'green'}
          icon={<ShieldAlert className="w-5 h-5 text-[#EF4444]" />}
        />
        <MetricCard
          label="High Severity Open"
          value={unresolvedHigh.toString()}
          subtext="Anomalies under review"
          badgeText={unresolvedHigh > 0 ? 'Elevated' : 'Nominal'}
          badgeVariant={unresolvedHigh > 0 ? 'amber' : 'green'}
          icon={<AlertTriangle className="w-5 h-5 text-[#F59E0B]" />}
        />
        <MetricCard
          label="Resolved Incidents"
          value={resolvedCount.toString()}
          subtext={`${totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(0) : 0}% mitigation rate`}
          badgeText="SOC Closed"
          badgeVariant="green"
          icon={<CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search alerts by ID, title, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-xs font-mono text-[#F1F5F9] rounded-lg outline-none placeholder-[#64748B]"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#64748B] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Severity:
          </span>
          <div className="flex bg-[#11151F] border border-[#1E2638] rounded-lg p-0.5 text-xs font-mono">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  severityFilter === sev
                    ? 'bg-[#182030] text-[#06B6D4] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#64748B]">Status:</span>
          <div className="flex bg-[#11151F] border border-[#1E2638] rounded-lg p-0.5 text-xs font-mono">
            {(['ALL', 'UNRESOLVED', 'RESOLVED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  statusFilter === st
                    ? 'bg-[#182030] text-[#06B6D4] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton variant="table" count={6} />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Security Alerts Found"
              description={
                searchTerm || severityFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No alerts match the configured filter criteria.'
                  : 'Zero anomalous triggers detected. Autonomous payment agents operating within compliant security thresholds.'
              }
              icon={<ShieldAlert className="w-8 h-8 text-[#10B981]" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2638] bg-[#11151F]/40 text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Alert ID</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Alert Title</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Event Ref</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]/50 text-xs">
                {filteredAlerts.map((alert) => {
                  const timestampStr = alert.created_at || alert.timestamp || new Date().toISOString()
                  const desc = alert.description || alert.message || 'Security alert triggered'
                  const titleStr = alert.title || alert.alert_type || 'SECURITY_TRIGGER'
                  const eventRef = alert.security_event_id || alert.agent_id || 'evt_001'

                  return (
                    <tr key={alert.id} className="hover:bg-[#11151F]/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#94A3B8] whitespace-nowrap">
                        {new Date(timestampStr).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#06B6D4] font-medium">
                        {alert.id}
                      </td>
                      <td className="py-3 px-4">
                        <SeverityBadge severity={alert.severity} />
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#F1F5F9]">
                        {titleStr}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8] max-w-sm truncate" title={desc}>
                        {desc}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8]">
                        {eventRef}
                      </td>
                      <td className="py-3 px-4">
                        {alert.is_resolved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            RESOLVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/30 animate-pulse">
                            <Clock className="w-3 h-3" />
                            NEW / ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!alert.is_resolved ? (
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="px-2.5 py-1 bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/30 text-[#06B6D4] rounded text-[11px] font-mono transition-colors"
                          >
                            Resolve
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="px-2.5 py-1 bg-[#182030] hover:bg-[#1E2638] text-[#94A3B8] rounded text-[11px] font-mono transition-colors"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Incident Dialog Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                <h3 className="text-base font-semibold text-[#F1F5F9]">
                  {selectedAlert.is_resolved ? 'Incident Resolution Details' : 'Resolve Security Incident'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-[#64748B] hover:text-[#F1F5F9] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-[#11151F] border border-[#1E2638] rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Alert ID:</span>
                  <span className="text-[#06B6D4]">{selectedAlert.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Title:</span>
                  <span className="text-[#F1F5F9]">{selectedAlert.title || selectedAlert.alert_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Event Ref:</span>
                  <span className="text-[#94A3B8]">{selectedAlert.security_event_id || selectedAlert.agent_id}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block mb-1">Description:</span>
                  <p className="text-[#F1F5F9] bg-[#07090E] p-2 rounded border border-[#1E2638]">
                    {selectedAlert.description || selectedAlert.message}
                  </p>
                </div>
              </div>

              {!selectedAlert.is_resolved ? (
                <form onSubmit={handleResolveAlert} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] block mb-1">
                      Analyst Resolution Notes:
                    </label>
                    <textarea
                      required
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Detail mitigation actions taken, e.g., verified mock prompt injection, updated corridor thresholds, or confirmed false positive..."
                      rows={3}
                      className="w-full bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-[#F1F5F9] rounded-lg p-2.5 outline-none resize-none text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAlert(null)}
                      className="px-4 py-2 bg-[#11151F] hover:bg-[#182030] text-[#94A3B8] rounded-lg text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResolving}
                      className="px-4 py-2 bg-[#10B981] hover:bg-[#10B981]/90 text-[#07090E] font-semibold rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isResolving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Resolving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirm Mitigation & Close
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
                  <div className="flex items-center gap-2 text-[#10B981] font-semibold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Incident Closed
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    This incident has been marked as resolved and verified in the audit database.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
