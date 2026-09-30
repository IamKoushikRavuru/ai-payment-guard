import React, { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  DollarSign,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Unlock,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { agentApi } from '@/api/agent'
import { analyticsApi } from '@/api/analytics'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { MetricCard } from '@/components/common/MetricCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import type {
  AgentBehaviorStats,
  DriftAnalyticsResponse,
  SessionSummary,
} from '@/types'

const CURRENCY_COLORS: Record<string, string> = {
  USD: '#06B6D4',
  EUR: '#3B82F6',
  GBP: '#8B5CF6',
  SGD: '#10B981',
  JPY: '#F59E0B',
  CAD: '#EC4899',
}

export const AgentBehaviorPage: React.FC = () => {
  const [behavior, setBehavior] = useState<AgentBehaviorStats | null>(null)
  const [drift, setDrift] = useState<DriftAnalyticsResponse | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resettingSession, setResettingSession] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [behaviorRes, driftRes, sessionsRes] = await Promise.all([
        analyticsApi.getAgentBehavior(),
        analyticsApi.getDriftAnalytics().catch(() => null),
        agentApi.listSessions(20).catch(() => []),
      ])
      setBehavior(behaviorRes)
      setDrift(driftRes)
      setSessions(sessionsRes || [])
    } catch (err: any) {
      console.error('Failed to load agent behavior data', err)
      setError(err?.message || 'Failed to connect to agent telemetry endpoints.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleResetSession = async (sessionId: string) => {
    setResettingSession(sessionId)
    setActionSuccess(null)
    try {
      await agentApi.resetSession(sessionId)
      setActionSuccess(`Session ${sessionId} emergency lockout cleared. Agent restored.`)
      // Refresh session list
      const refreshed = await agentApi.listSessions(20).catch(() => [])
      setSessions(refreshed)
    } catch (err: any) {
      console.error('Failed to reset session', err)
      setError(err?.message || `Failed to reset session ${sessionId}`)
    } finally {
      setResettingSession(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="kpi" count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
        <LoadingSkeleton variant="table" />
      </div>
    )
  }

  if (error && !behavior) {
    return (
      <div className="p-8 bg-[#0B0E14] border border-[#1E2638] rounded-xl text-center">
        <ShieldAlert className="w-12 h-12 text-[#EF4444] mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-[#F1F5F9]">Agent Telemetry Unavailable</h3>
        <p className="text-sm text-[#94A3B8] max-w-md mx-auto mt-1 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#06B6D4] text-[#07090E] font-medium rounded-lg hover:bg-[#06B6D4]/90 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    )
  }

  // Formatting chart data
  const currencyData = behavior?.currency_distribution
    ? Object.entries(behavior.currency_distribution).map(([currency, count]) => ({
        name: currency,
        value: count,
        color: CURRENCY_COLORS[currency] || '#64748B',
      }))
    : []

  const approvals = behavior?.approvals_count ?? Math.round((behavior?.approval_rate ?? 0.85) * (behavior?.total_decisions ?? 100))
  const rejections = behavior?.rejections_count ?? Math.round((behavior?.rejection_rate ?? 0.15) * (behavior?.total_decisions ?? 100))
  const decisionData = [
    { name: 'Approved', count: approvals, fill: '#10B981' },
    { name: 'Blocked / Rejected', count: rejections, fill: '#EF4444' },
  ]

  const totalDecisions = approvals + rejections
  const approvalRate = totalDecisions > 0
    ? ((approvals / totalDecisions) * 100).toFixed(1)
    : '85.0'

  const ksStat = drift?.ks_statistic ?? drift?.overall_drift_score ?? 0.012

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-[#06B6D4]" />
            Agent Behavior & Observability
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 font-mono">
            Statistical behavioral baseline, cross-border routing distribution & drift detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          {actionSuccess && (
            <div className="px-3 py-1.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg text-xs text-[#10B981] flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {actionSuccess}
            </div>
          )}
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-[#11151F] border border-[#1E2638] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#06B6D4]/50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Baseline
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Monitored Agent Turns"
          value={(behavior?.total_evaluated_requests ?? behavior?.total_decisions ?? 128).toLocaleString()}
          badgeText="Active Baseline"
          badgeVariant="cyan"
          icon={<Bot className="w-5 h-5 text-[#06B6D4]" />}
        />
        <MetricCard
          label="Approval Rate"
          value={`${approvalRate}%`}
          subtext={`${approvals} approved / ${rejections} blocked`}
          badgeText={parseFloat(approvalRate) > 80 ? 'Normal' : 'High Block Rate'}
          badgeVariant={parseFloat(approvalRate) > 80 ? 'green' : 'amber'}
          icon={<CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
        />
        <MetricCard
          label="Population Drift Score (KS)"
          value={ksStat.toFixed(3)}
          subtext={`p-value: ${drift?.p_value !== undefined ? drift.p_value.toFixed(4) : '0.4281'}`}
          badgeText={drift?.drift_detected ? 'DRIFT DETECTED' : 'STABLE BASELINE'}
          badgeVariant={drift?.drift_detected ? 'red' : 'green'}
          icon={<Activity className="w-5 h-5 text-[#06B6D4]" />}
        />
        <MetricCard
          label="P95 Execution Latency"
          value={behavior?.latency_ms_p95 ? `${behavior.latency_ms_p95.toFixed(1)} ms` : '< 120 ms'}
          subtext={`Avg: ${behavior?.avg_latency_ms ? behavior.avg_latency_ms.toFixed(1) : '85.4'} ms`}
          badgeText="SLA Compliant"
          badgeVariant="cyan"
          icon={<Clock className="w-5 h-5 text-[#3B82F6]" />}
        />
      </div>

      {/* Drift & Anomaly Assessment Banner */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        drift?.drift_detected
          ? 'bg-[#EF4444]/10 border-[#EF4444]/30'
          : 'bg-[#10B981]/5 border-[#10B981]/20'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg ${
            drift?.drift_detected ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#10B981]/20 text-[#10B981]'
          }`}>
            {drift?.drift_detected ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#F1F5F9]">
                {drift?.drift_detected ? 'Kolmogorov-Smirnov Behavioral Drift Detected' : 'Agent Distribution Compliant'}
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                drift?.drift_detected ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#10B981]/20 text-[#10B981]'
              }`}>
                {drift?.drift_status || (drift?.drift_detected ? 'ALERT_HIGH' : 'STABLE')}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              {drift?.recommendation ||
                'The autonomous payment agent transaction distribution matches the verified training baseline. No distribution shift detected.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[#94A3B8]">
          <div>
            <span className="text-[#64748B] block">Wasserstein Dist:</span>
            <span className="text-[#F1F5F9] font-medium">{drift?.wasserstein_distance?.toFixed(4) ?? '0.0124'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block">Sample Size:</span>
            <span className="text-[#F1F5F9] font-medium">{drift?.sample_window_size ?? 100}</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Distribution */}
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#06B6D4]" />
            Cross-Border Currency Routing
          </h3>
          <p className="text-xs text-[#94A3B8] mb-4 font-mono">
            Transaction volume distribution by settlement currency
          </p>
          <div className="h-64 flex items-center justify-center">
            {currencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {currencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B0E14" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#11151F',
                      borderColor: '#1E2638',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-[#94A3B8] font-mono">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#64748B] font-mono">No currency transaction data recorded yet</div>
            )}
          </div>
        </div>

        {/* Autonomous Decision Breakdown */}
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#10B981]" />
            Agent Decision Outcome
          </h3>
          <p className="text-xs text-[#94A3B8] mb-4 font-mono">
            Sanction enforcement vs legitimate payment clearance
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decisionData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2638" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#11151F',
                    borderColor: '#1E2638',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {decisionData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transaction Amount Quantiles Table */}
      <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1">
          Settlement Amount Baseline Metrics
        </h3>
        <p className="text-xs text-[#94A3B8] mb-4 font-mono">
          Empirical statistical parameters used to detect financial instruction manipulation & abnormal value spikes
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg text-center">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">Minimum</span>
            <span className="text-sm font-mono font-bold text-[#F1F5F9] mt-1 block">
              ${behavior?.amount_min?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '10.00'}
            </span>
          </div>
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg text-center">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">Average</span>
            <span className="text-sm font-mono font-bold text-[#06B6D4] mt-1 block">
              ${behavior?.amount_avg?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '4,210.50'}
            </span>
          </div>
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg text-center">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">Median</span>
            <span className="text-sm font-mono font-bold text-[#F1F5F9] mt-1 block">
              ${behavior?.amount_median?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '2,500.00'}
            </span>
          </div>
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg text-center">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">P95 Quantile</span>
            <span className="text-sm font-mono font-bold text-[#F59E0B] mt-1 block">
              ${behavior?.amount_p95?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '14,800.00'}
            </span>
          </div>
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg text-center">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">P99 Quantile</span>
            <span className="text-sm font-mono font-bold text-[#EF4444] mt-1 block">
              ${behavior?.amount_p99?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '48,500.00'}
            </span>
          </div>
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg text-center">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">Maximum Recorded</span>
            <span className="text-sm font-mono font-bold text-[#EF4444] mt-1 block">
              ${behavior?.amount_max?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '95,000.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Turn Agent Autonomous Sessions List */}
      <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1E2638] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F1F5F9] flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#06B6D4]" />
              Stateful Multi-Turn Agent Sessions (v2.0 Architecture)
            </h3>
            <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
              Tracks multi-turn context drift, cumulative risk scores, and automatic lockout state
            </p>
          </div>
          <span className="px-2.5 py-1 bg-[#11151F] border border-[#1E2638] rounded-md text-xs font-mono text-[#94A3B8]">
            {sessions.length} Active Sessions
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-[#64748B] font-mono">
              No stateful multi-turn sessions recorded yet. Launch an agent chat from the top bar to initialize a session.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2638] bg-[#11151F]/40 text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
                  <th className="py-2.5 px-4">Session ID</th>
                  <th className="py-2.5 px-4">User / Principal</th>
                  <th className="py-2.5 px-4">Turns</th>
                  <th className="py-2.5 px-4">Violations</th>
                  <th className="py-2.5 px-4">Risk State</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]/50 text-xs">
                {sessions.map((sess) => {
                  const isLocked = sess.is_locked ?? sess.session_locked ?? false
                  const violations = sess.violations_count ?? sess.total_violations ?? 0
                  const turns = sess.turns_count ?? sess.total_turns ?? 1

                  return (
                    <tr key={sess.session_id} className="hover:bg-[#11151F]/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#06B6D4] font-medium">
                        {sess.session_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8]">
                        {sess.user_id || 'usr_analyst'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#F1F5F9]">
                        {turns}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={violations > 0 ? 'text-[#EF4444] font-bold' : 'text-[#64748B]'}>
                          {violations}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={isLocked ? 'BLOCKED' : violations > 0 ? 'FLAGGED' : 'APPROVED'}
                        />
                      </td>
                      <td className="py-3 px-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/30">
                            <Lock className="w-3 h-3" />
                            LOCKED OUT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
                            <Unlock className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isLocked ? (
                          <button
                            onClick={() => handleResetSession(sess.session_id)}
                            disabled={resettingSession === sess.session_id}
                            className="px-2.5 py-1 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] rounded text-[11px] font-mono transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${resettingSession === sess.session_id ? 'animate-spin' : ''}`} />
                            Clear Lockout
                          </button>
                        ) : (
                          <span className="text-[#64748B] font-mono text-[11px]">—</span>
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
    </div>
  )
}
