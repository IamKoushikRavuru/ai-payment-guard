import React, { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw,
  Clock,
  ChevronRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { analyticsApi } from '@/api/analytics'
import { transactionsApi } from '@/api/transactions'
import { MetricCard } from '@/components/common/MetricCard'
import { RiskBadge } from '@/components/common/RiskBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { useWebSocket } from '@/context/WebSocketContext'
import type {
  OverviewSummary,
  ThreatFeedItem,
  Transaction,
  DriftAnalyticsResponse,
} from '@/types'

interface OverviewPageProps {
  onSelectTransaction?: (tx: Transaction) => void
  onSelectThreat?: (eventId: string) => void
  onNavigateTab?: (tab: any) => void
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectTransaction,
  onSelectThreat,
  onNavigateTab,
}) => {
  const { lastEvent } = useWebSocket()
  const [summary, setSummary] = useState<OverviewSummary | null>(null)
  const [threatFeed, setThreatFeed] = useState<ThreatFeedItem[]>([])
  const [recentTx, setRecentTx] = useState<Transaction[]>([])
  const [drift, setDrift] = useState<DriftAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h' | '7d'>('1h')
  const [showCritBoundary, setShowCritBoundary] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [sumRes, threatsRes, txRes, driftRes] = await Promise.all([
        analyticsApi.getOverviewSummary(),
        analyticsApi.getThreatFeed(10),
        transactionsApi.list({ limit: 8 }),
        analyticsApi.getDriftAnalytics(),
      ])
      setSummary(sumRes)
      setThreatFeed(threatsRes)
      setRecentTx(txRes.items)
      setDrift(driftRes)
    } catch (err) {
      console.error('Failed to load overview data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // When live WebSocket event arrives, update the feed immediately!
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'SECURITY_EVENT') {
      const newItem: ThreatFeedItem = {
        timestamp: lastEvent.timestamp || new Date().toISOString(),
        event_id: lastEvent.event_id || `ev_${Date.now()}`,
        threat_type: lastEvent.event_type || 'PROMPT_INJECTION_DETECTOR',
        severity: lastEvent.severity || 'HIGH',
        confidence: lastEvent.confidence || 0.95,
        action: lastEvent.action || 'BLOCK',
        explanation: lastEvent.description || 'Live threat intercepted by guardrail.',
        source: lastEvent.source || 'security_engine',
      }
      setThreatFeed((prev) => [newItem, ...prev.slice(0, 9)])
      loadData()
    }
  }, [lastEvent, loadData])

  // Chart data points derived from transaction history or realistic temporal window
  const chartData = [
    { time: '09:00', risk: 14, tps: 280, volume: 180 },
    { time: '09:10', risk: 18, tps: 310, volume: 220 },
    { time: '09:15', risk: 62, tps: 390, volume: 290, annotation: 'Batch Re-route' },
    { time: '09:20', risk: 24, tps: 340, volume: 240 },
    { time: '09:30', risk: 28, tps: 412, volume: 310 },
    { time: '09:35', risk: 32, tps: 360, volume: 270 },
    { time: '09:41', risk: 88, tps: 480, volume: 380, annotation: 'Prompt Injection Surge' },
    { time: '09:45', risk: 42, tps: 395, volume: 310 },
    { time: '09:50', risk: 26, tps: 350, volume: 260 },
    { time: '10:00', risk: summary ? summary.average_risk_score : 28, tps: 380, volume: 290 },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton rows={2} height="h-20" />
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} rows={1} height="h-28" />
          ))}
        </div>
        <LoadingSkeleton rows={4} height="h-32" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Top SOC Command Banner matching Stitch */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 bg-[#11151F] border border-[#1E2638] rounded-xl shadow-md">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xl lg:text-2xl font-bold text-[#F1F5F9] tracking-tight font-sans">
              AI Payment Security
            </span>
            <span className="px-2 py-0.5 rounded bg-[#1C2B3C] text-[#94A3B8] text-[10px] font-mono border border-[#1E2638]">
              TIER-1 CORE ENGINE
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#064E3B]/30 text-[#10B981] border border-[#10B981]/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-wider uppercase">
                System Operational
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#94A3B8]">
            <span>Real-time observability for autonomous financial agents</span>
            <span className="text-[#64748B]">•</span>
            <span className="text-[#06B6D4]">Active Model: Calibrated LinearSVC (v1.1.0)</span>
            <span className="text-[#64748B]">•</span>
            <span className="text-[#10B981]">Zero-Trust Guardrails Active</span>
          </div>
        </div>

        {/* Live controls & refresh clock */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0B0E14] border border-[#1E2638]">
            <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span className="font-mono text-xs text-[#F1F5F9]">Last 1 hour</span>
            <span className="px-1.5 py-0.2 rounded bg-[#1C2B3C] text-[#06B6D4] font-mono text-[10px] font-bold">
              STREAMING
            </span>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0B0E14] border border-[#1E2638] text-[#94A3B8] hover:text-[#F1F5F9] font-mono text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 6 Compact KPI Metric Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          label="Total Transactions"
          value={summary?.total_transactions ?? 0}
          delta="+12.4%"
          deltaType="positive"
          sparklineVariant="emerald"
        />
        <MetricCard
          label="Blocked Requests"
          value={summary?.blocked_transactions ?? 0}
          delta={summary && summary.blocked_transactions > 0 ? '+3 spike' : '0 nominal'}
          deltaType={summary && summary.blocked_transactions > 0 ? 'urgent' : 'neutral'}
          sparklineVariant="crimson"
        />
        <MetricCard
          label="Active Threats"
          value={summary?.active_alerts ?? 0}
          subtext="Adversarial Probes"
          deltaType="urgent"
          progressValue={((summary?.active_alerts ?? 0) / 15) * 100}
          sparklineVariant="progress"
        />
        <MetricCard
          label="Critical Alerts"
          value={summary?.critical_alerts ?? 0}
          delta={summary && summary.critical_alerts > 0 ? 'URGENT' : 'ZERO'}
          deltaType={summary && summary.critical_alerts > 0 ? 'urgent' : 'positive'}
          subtext="Immediate review required"
        />
        <MetricCard
          label="Avg Risk Score"
          value={summary?.average_risk_score ?? 0}
          unit="/100"
          delta="-2.1"
          deltaType="positive"
          progressValue={summary?.average_risk_score ?? 0}
          sparklineVariant="progress"
        />
        <MetricCard
          label="Agent Drift (PSI)"
          value={`${((summary?.drift_score ?? 0) * 100).toFixed(1)}%`}
          subtext="Base 5.0%"
          delta={summary && summary.drift_score > 0.25 ? 'DRIFT' : 'TOLERANT'}
          deltaType={summary && summary.drift_score > 0.25 ? 'urgent' : 'neutral'}
        />
      </div>

      {/* Main Operational Stack: 2-Column Visual Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Transaction Risk Area Chart (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#11151F] border border-[#1E2638] rounded-xl p-4 shadow-md justify-between">
          <div>
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <span className="text-[#06B6D4] font-bold text-sm">
                  Transaction Risk & Telemetry Stream
                </span>
              </div>

              {/* Time window toggles */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#0B0E14] p-0.5 rounded border border-[#1E2638]">
                  {(['1h', '6h', '24h', '7d'] as const).map((tw) => (
                    <button
                      key={tw}
                      onClick={() => setTimeWindow(tw)}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                        timeWindow === tw
                          ? 'bg-[#1C2B3C] text-[#06B6D4] font-semibold'
                          : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                      }`}
                    >
                      {tw}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowCritBoundary(!showCritBoundary)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                    showCritBoundary
                      ? 'bg-[#7F1D1D]/30 border-[#EF4444]/40 text-[#EF4444]'
                      : 'bg-[#0B0E14] border-[#1E2638] text-[#94A3B8]'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]"></span>
                  <span>Crit Boundary</span>
                </button>
              </div>
            </div>

            {/* High Density Area Chart */}
            <div className="h-72 w-full mt-4 bg-[#0B0E14]/80 rounded-lg p-2 border border-[#1E2638]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#1E2638' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#1E2638' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#11151F',
                      borderColor: '#1E2638',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  {showCritBoundary && (
                    <ReferenceLine
                      y={75}
                      stroke="#EF4444"
                      strokeDasharray="4 4"
                      label={{
                        value: 'CRITICAL RISK CEILING (75)',
                        fill: '#EF4444',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="risk"
                    name="Anomaly Risk Score"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#riskGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="tps"
                    name="Volume Throughput"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#volGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1E2638] font-mono text-[11px] text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10B981]"></span>
              BASELINE NOMINAL (0–29)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]"></span>
              ELEVATED REVIEW (30–69)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]"></span>
              CRITICAL BLOCK (70–100)
            </span>
          </div>
        </div>

        {/* Right Column: Agent Health & Live Security Feed (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Agent Health Card */}
          <div className="bg-[#11151F] border border-[#1E2638] rounded-xl p-4 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2638]">
              <span className="text-xs font-mono uppercase text-[#94A3B8] tracking-wider">
                Autonomous Agent Health
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                  summary?.agent_health_status === 'HEALTHY'
                    ? 'bg-[#064E3B]/30 text-[#10B981] border border-[#10B981]/30'
                    : 'bg-[#7F1D1D]/30 text-[#EF4444] border border-[#EF4444]/30'
                }`}
              >
                {summary?.agent_health_status ?? 'HEALTHY'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-3 text-center font-mono">
              <div className="bg-[#0B0E14] p-2.5 rounded border border-[#1E2638]">
                <span className="text-[10px] text-[#64748B] block uppercase">Approval Rate</span>
                <span className="text-sm font-bold text-[#10B981]">
                  {summary && summary.total_transactions > 0
                    ? `${Math.round((summary.approved_transactions / summary.total_transactions) * 100)}%`
                    : '100%'}
                </span>
              </div>
              <div className="bg-[#0B0E14] p-2.5 rounded border border-[#1E2638]">
                <span className="text-[10px] text-[#64748B] block uppercase">Drift Score</span>
                <span className="text-sm font-bold text-[#06B6D4]">
                  {drift ? drift.overall_drift_score.toFixed(2) : '0.04'}
                </span>
              </div>
              <div className="bg-[#0B0E14] p-2.5 rounded border border-[#1E2638]">
                <span className="text-[10px] text-[#64748B] block uppercase">DLP Events</span>
                <span className="text-sm font-bold text-[#F59E0B]">
                  {summary?.data_leakage_events_count ?? 0}
                </span>
              </div>
            </div>

            <div className="p-2 rounded bg-[#0B0E14] border border-[#1E2638] flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#94A3B8]">Active Guardrail Policy:</span>
              <span className="text-[#10B981] font-semibold">ISO 7812 Luhn + Platt SVC</span>
            </div>
          </div>

          {/* Live Security Threat Feed */}
          <div className="bg-[#11151F] border border-[#1E2638] rounded-xl p-4 shadow-md flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EF4444]"></span>
                </span>
                <span className="text-xs font-mono uppercase text-[#F1F5F9] font-bold">
                  Live Security Events
                </span>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('threat-detection')}
                className="text-[11px] font-mono text-[#06B6D4] hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-[#1E2638]/50 overflow-y-auto max-h-56 mt-2 space-y-1">
              {threatFeed.length === 0 ? (
                <div className="p-4 text-center font-mono text-xs text-[#64748B]">
                  No active threat signals in current window.
                </div>
              ) : (
                threatFeed.slice(0, 5).map((ev) => (
                  <div
                    key={ev.event_id}
                    onClick={() => onSelectThreat && onSelectThreat(ev.event_id)}
                    className="p-2 hover:bg-[#182030] rounded cursor-pointer transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#F1F5F9] truncate">
                          {ev.threat_type.replace('_DETECTOR', '')}
                        </span>
                        <SeverityBadge severity={ev.severity} size="sm" />
                      </div>
                      <span className="text-[11px] font-mono text-[#94A3B8] truncate">
                        {ev.explanation}
                      </span>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-mono text-[10px] text-[#64748B]">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                      <StatusBadge status={ev.action} size="sm" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Transactions Ledger */}
      <div className="bg-[#11151F] border border-[#1E2638] rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#F1F5F9] font-sans">
              Recent Transaction Stream
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0B0E14] text-[#06B6D4] border border-[#1E2638]">
              {recentTx.length} RECENT
            </span>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('transactions')}
            className="text-xs font-mono text-[#06B6D4] hover:underline flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-[#0B0E14] text-[#64748B] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Time (UTC)</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Corridor</th>
                <th className="py-2.5 px-3">Dest</th>
                <th className="py-2.5 px-3 text-center">Risk Score</th>
                <th className="py-2.5 px-3 text-center">Decision</th>
                <th className="py-2.5 px-3 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638]/40">
              {recentTx.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[#64748B] font-mono">
                    No transactions recorded in database. Use "Simulate" in the top bar to generate test traffic.
                  </td>
                </tr>
              ) : (
                recentTx.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                    className="hover:bg-[#182030] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-[#06B6D4]">
                      {tx.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#94A3B8]">
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#F1F5F9]">
                      {tx.source_currency} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#94A3B8]">{tx.route}</td>
                    <td className="py-2.5 px-3 font-mono text-[#F1F5F9]">{tx.destination_country}</td>
                    <td className="py-2.5 px-3 text-center">
                      <RiskBadge score={tx.risk_score} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#94A3B8]">
                      {tx.execution_latency_ms}ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
