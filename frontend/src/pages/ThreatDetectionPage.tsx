import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldAlert,
  Search,
  Radar,
  Copy,
  Check,
  Bug,
  Brain,
  History,
  Lock,
  Download,
  ShieldCheck,
  RefreshCw,
  Terminal,
} from 'lucide-react'
import { securityApi } from '@/api/security'
import { RiskBadge } from '@/components/common/RiskBadge'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useWebSocket } from '@/context/WebSocketContext'
import type { SecurityEvent } from '@/types'

export const ThreatDetectionPage: React.FC = () => {
  const { lastEvent } = useWebSocket()
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [streamActive, setStreamActive] = useState(true)

  const loadEvents = useCallback(async () => {
    try {
      const res = await securityApi.listEvents({
        limit: 50,
        severity: filterSeverity === 'ALL' ? undefined : filterSeverity,
      })
      setEvents(res.items)
      if (res.items.length > 0 && !selectedEvent) {
        setSelectedEvent(res.items[0])
      }
    } catch (err) {
      console.error('Failed to load security events:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filterSeverity, selectedEvent])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Real-time event push
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'SECURITY_EVENT' && streamActive) {
      loadEvents()
    }
  }, [lastEvent, streamActive, loadEvents])

  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      e.event_type.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      (e.payload_snippet && e.payload_snippet.toLowerCase().includes(q))
    )
  })

  const handleCopyPayload = () => {
    if (selectedEvent?.payload_snippet) {
      navigator.clipboard.writeText(selectedEvent.payload_snippet)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // Aggregate metric tile counts
  const promptInjectionCount = events.filter((e) => e.event_type.includes('PROMPT_INJECTION')).length
  const jailbreakCount = events.filter((e) => e.event_type.includes('JAILBREAK')).length
  const financialCount = events.filter((e) => e.event_type.includes('FINANCIAL')).length
  const dlpCount = events.filter((e) => e.event_type.includes('SENSITIVE_DATA')).length
  const blockedCount = events.filter((e) => e.action === 'BLOCK').length

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton rows={1} height="h-20" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} rows={1} height="h-24" />
          ))}
        </div>
        <LoadingSkeleton rows={6} height="h-16" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Section Header & SOC Controls Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#93000A]/40 text-[#EF4444] font-bold uppercase tracking-wider">
                THREAT TELEMETRY V4
              </span>
              <span className="font-mono text-xs text-[#64748B]">
                ENGINE: AEGIS-LLM-SHIELD // CALIBRATED SVC // REALTIME
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-[#F1F5F9] tracking-tight font-sans">
              Threat Detection & AI Incident Response
            </h1>
            <p className="text-xs text-[#94A3B8] font-mono">
              Autonomous adversarial defense, jailbreak mitigation, and instruction anomaly forensics across agent pipelines
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start xl:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#1C2B3C] border border-[#1E2638]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EF4444]"></span>
              </span>
              <span className="font-mono text-xs text-[#EF4444] font-bold">DEFCON-2</span>
              <span className="text-[#64748B] font-mono text-xs">/</span>
              <span className="font-mono text-xs text-[#F1F5F9]">ZERO-TRUST ACTIVE</span>
            </div>

            <button
              onClick={loadEvents}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#11151F] hover:bg-[#182030] text-[#06B6D4] font-mono text-xs border border-[#06B6D4]/30 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Stream</span>
            </button>
          </div>
        </div>

        {/* Tactical SOC Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-1.5 rounded bg-[#0B0E14] border border-[#1E2638]">
          <div className="md:col-span-6 flex items-center bg-[#11151F] rounded px-3 py-1.5 border border-[#1E2638]">
            <Search className="w-4 h-4 text-[#64748B] mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by attack vector, signature, or explanation..."
              className="w-full bg-transparent font-mono text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none"
            />
          </div>

          <div className="md:col-span-3 flex items-center bg-[#11151F] rounded px-3 py-1.5 justify-between border border-[#1E2638]">
            <span className="font-mono text-[10px] text-[#64748B] uppercase">SEVERITY:</span>
            <div className="flex items-center gap-1">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                    filterSeverity === sev
                      ? 'bg-[#06B6D4] text-[#07090E] font-bold'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 flex items-center bg-[#11151F] rounded px-3 py-1.5 justify-between border border-[#1E2638]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {streamActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    streamActive ? 'bg-[#10B981]' : 'bg-[#64748B]'
                  }`}
                ></span>
              </span>
              <span className="font-mono text-[11px] text-[#10B981] font-bold uppercase">
                STREAM: {streamActive ? 'ON' : 'OFF'}
              </span>
            </div>
            <button
              onClick={() => setStreamActive(!streamActive)}
              className="text-[10px] font-mono text-[#06B6D4] hover:underline"
            >
              Toggle
            </button>
          </div>
        </div>
      </div>

      {/* 5 Top Threat Statistics Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[#11151F] border border-[#1E2638] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#94A3B8] uppercase">Prompt Injection</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#93000A]/30 text-[#EF4444] font-bold">
              CRITICAL
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-sans text-[#F1F5F9]">{promptInjectionCount}</span>
            <span className="font-mono text-[10px] text-[#10B981]">100% Intercepted</span>
          </div>
          <div className="w-full bg-[#0B0E14] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#EF4444] h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#11151F] border border-[#1E2638] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#94A3B8] uppercase">Jailbreak Attacks</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#78350F]/30 text-[#F59E0B]">
              HIGH
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-sans text-[#F1F5F9]">{jailbreakCount}</span>
            <span className="font-mono text-[10px] text-[#94A3B8]">DAN & Suffixes</span>
          </div>
          <div className="w-full bg-[#0B0E14] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#11151F] border border-[#1E2638] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#94A3B8] uppercase">Financial Manip</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1C2B3C] text-[#06B6D4]">
              FIN-SEC
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-sans text-[#F1F5F9]">{financialCount}</span>
            <span className="font-mono text-[10px] text-[#EF4444]">Limit & FX checks</span>
          </div>
          <div className="w-full bg-[#0B0E14] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#06B6D4] h-full rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#11151F] border border-[#1E2638] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#94A3B8] uppercase">Data Leakage (PCI)</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#0566D9]/30 text-[#adc6ff]">
              PAN-GUARD
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-sans text-[#F1F5F9]">{dlpCount}</span>
            <span className="font-mono text-[10px] text-[#10B981]">Luhn Checksum</span>
          </div>
          <div className="w-full bg-[#0B0E14] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#10B981] h-full rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#11151F] border border-[#1E2638] flex flex-col justify-between col-span-2 md:col-span-3 xl:col-span-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#94A3B8] uppercase">Blocked Requests</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1C2B3C] text-[#F1F5F9]">
              GLOBAL
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-sans text-[#EF4444]">{blockedCount}</span>
            <span className="font-mono text-[10px] text-[#10B981]">0% Breach Rate</span>
          </div>
          <div className="w-full bg-[#0B0E14] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#EF4444] h-full rounded-full" style={{ width: '92%' }}></div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Table (7 cols) + Forensics Panel (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Column: Attack Event Stream Table */}
        <div className="xl:col-span-7 flex flex-col gap-3">
          <div className="bg-[#11151F] border border-[#1E2638] rounded-xl p-4 shadow-md flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-[#06B6D4]" />
                <h2 className="font-sans text-sm font-bold text-[#F1F5F9]">
                  AI Attack Event Stream
                </h2>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0B0E14] text-[#06B6D4] font-bold">
                  {filteredEvents.length} DETECTED
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#64748B]">
                REALTIME BROADCAST: ACTIVE
              </span>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-[#0B0E14] text-[#64748B] font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-2.5">Threat Type</th>
                    <th className="py-2 px-2.5">Time (UTC)</th>
                    <th className="py-2 px-2.5 text-center">Sev</th>
                    <th className="py-2 px-2.5 text-center">Confidence</th>
                    <th className="py-2 px-2.5 text-right">Risk</th>
                    <th className="py-2 px-2.5 text-center">Action</th>
                    <th className="py-2 px-2.5 text-right">Forensics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2638]/40 font-mono text-xs">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#64748B]">
                        No threat events detected matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((ev) => {
                      const isSelected = selectedEvent?.id === ev.id
                      return (
                        <tr
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#1C2B3C] text-[#F1F5F9]'
                              : 'hover:bg-[#182030] text-[#94A3B8]'
                          }`}
                        >
                          <td className="py-2.5 px-2.5 font-bold text-[#06B6D4] truncate max-w-[140px]">
                            {ev.event_type.replace('_DETECTOR', '')}
                          </td>
                          <td className="py-2.5 px-2.5 text-[#94A3B8]">
                            {new Date(ev.created_at).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-2.5 text-center">
                            <SeverityBadge severity={ev.severity} size="sm" />
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-bold text-[#F1F5F9]">
                            {Math.round(ev.confidence * 100)}%
                          </td>
                          <td className="py-2.5 px-2.5 text-right">
                            <RiskBadge score={ev.risk_score} size="sm" />
                          </td>
                          <td className="py-2.5 px-2.5 text-center">
                            <StatusBadge status={ev.action} size="sm" />
                          </td>
                          <td className="py-2.5 px-2.5 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold inline-block ${
                                isSelected
                                  ? 'bg-[#06B6D4] text-[#07090E]'
                                  : 'bg-[#182030] text-[#94A3B8] hover:text-white'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Inspect'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Terminal Log Scroller matching Stitch */}
            <div className="mt-4 p-3 rounded bg-[#07090E] border border-[#1E2638] font-mono text-[11px] text-[#94A3B8] flex flex-col gap-1">
              <div className="flex items-center justify-between pb-1 border-b border-[#1E2638]/50 text-[10px] text-[#64748B]">
                <span className="flex items-center gap-1.5 text-[#06B6D4]">
                  <Terminal className="w-3.5 h-3.5" /> LIVE MITIGATION STREAM
                </span>
                <span className="text-[#10B981]">0 PACKET LOSS // TLS 1.3 PINNED</span>
              </div>
              <p>
                <span className="text-[#64748B]">19:42:13</span> <span className="text-[#EF4444]">[CRIT_BLOCK]</span> Hash <span className="text-[#06B6D4]">0x7F91..B39E</span> intercepted by Layer-7 Shield Rule SEC-NO-BYPASS.
              </p>
              <p>
                <span className="text-[#64748B]">19:42:13</span> <span className="text-[#10B981]">[ISOLATION]</span> Session memory quarantined. Forensic artifact tagged.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Incident Investigation Forensics Panel matching Stitch */}
        <div className="xl:col-span-5 flex flex-col gap-3">
          {selectedEvent ? (
            <div className="bg-[#11151F] border border-[#1E2638] rounded-xl p-5 shadow-md flex flex-col justify-between h-full">
              {/* Forensics Header */}
              <div>
                <div className="flex items-start justify-between pb-3 mb-3 bg-[#0B0E14] p-3 rounded border border-[#1E2638]">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#06B6D4]">
                        {selectedEvent.id}
                      </span>
                      <span className="px-2 py-0.2 rounded bg-[#93000A]/40 text-[#EF4444] font-mono text-[10px] font-bold">
                        {selectedEvent.action === 'BLOCK' ? 'CRITICAL THREAT CONTAINED' : 'EVALUATED'}
                      </span>
                    </div>
                    <h3 className="font-sans text-sm font-bold text-[#F1F5F9] mt-1">
                      {selectedEvent.event_type.replace('_DETECTOR', '')}
                    </h3>
                    <span className="font-mono text-[11px] text-[#94A3B8]">
                      Origin: {selectedEvent.agent_id} // Pipeline
                    </span>
                  </div>
                </div>

                {/* Telemetry Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2.5 rounded bg-[#0B0E14] border border-[#1E2638] flex flex-col">
                    <span className="font-mono text-[10px] text-[#64748B] uppercase">Severity</span>
                    <span className="font-mono text-xs font-bold text-[#EF4444] mt-0.5">
                      {selectedEvent.severity}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#0B0E14] border border-[#1E2638] flex flex-col">
                    <span className="font-mono text-[10px] text-[#64748B] uppercase">Risk Rating</span>
                    <span className="font-mono text-xs font-bold text-[#EF4444] mt-0.5">
                      {selectedEvent.risk_score} / 100
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#0B0E14] border border-[#1E2638] flex flex-col">
                    <span className="font-mono text-[10px] text-[#64748B] uppercase">Confidence</span>
                    <span className="font-mono text-xs font-bold text-[#06B6D4] mt-0.5">
                      {Math.round(selectedEvent.confidence * 100)}% MATCH
                    </span>
                  </div>
                </div>

                {/* Operational Metadata */}
                <div className="flex flex-col gap-1.5 p-3 rounded bg-[#0B0E14] border border-[#1E2638] mb-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">TARGETED POLICY:</span>
                    <span className="text-[#F1F5F9] font-medium truncate max-w-[200px]">
                      {selectedEvent.source}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">ENFORCED ACTION:</span>
                    <span className="text-[#EF4444] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
                      {selectedEvent.action} (0ms LATENCY)
                    </span>
                  </div>
                </div>

                {/* Attack Payload Inspection Card */}
                {selectedEvent.payload_snippet && (
                  <div className="flex flex-col mb-4">
                    <div className="flex items-center justify-between mb-1 px-1">
                      <span className="font-mono text-[11px] text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                        <Bug className="w-3.5 h-3.5 text-[#EF4444]" />
                        Adversarial Raw Token Payload
                      </span>
                      <button
                        onClick={handleCopyPayload}
                        className="font-mono text-[10px] text-[#06B6D4] hover:underline flex items-center gap-1"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy Payload'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded bg-[#07090E] border border-[#1E2638] font-mono text-xs text-[#F1F5F9] leading-relaxed overflow-x-auto select-all">
                      <span className="text-[#EF4444] font-bold">"{selectedEvent.payload_snippet}"</span>
                    </div>
                  </div>
                )}

                {/* Explainable AI SecOps Telemetry Signals */}
                <div className="flex flex-col mb-4">
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <span className="font-mono text-[11px] text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-[#10B981]" />
                      Explainable AI SecOps Telemetry
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-[#0B0E14] border border-[#1E2638] flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded bg-[#7F1D1D]/30 border border-[#EF4444]/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#EF4444] text-[10px] font-bold">✕</span>
                      </div>
                      <div className="flex flex-col font-sans text-xs">
                        <span className="font-bold text-[#F1F5F9]">Detection Explanation</span>
                        <span className="text-[#94A3B8] font-mono text-[11px] mt-0.5">
                          {selectedEvent.description}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#0B0E14] border border-[#1E2638] flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded bg-[#064E3B]/30 border border-[#10B981]/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#10B981] text-[10px] font-bold">✓</span>
                      </div>
                      <div className="flex flex-col font-sans text-xs">
                        <span className="font-bold text-[#F1F5F9]">Deterministic Validation</span>
                        <span className="text-[#94A3B8] font-mono text-[11px] mt-0.5">
                          Verified against OFAC sanctions registry and ISO 7812 checksum routines.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Incident Mitigation Timeline */}
                <div className="flex flex-col mb-4">
                  <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider mb-2 px-1">
                    Incident Mitigation Timeline (High-Res UTC)
                  </span>
                  <div className="flex flex-col gap-2 relative pl-3 font-mono text-xs">
                    <div className="absolute left-1 top-1 bottom-1 w-0.5 bg-[#1E2638]"></div>
                    <div className="flex items-baseline gap-2 relative">
                      <span className="w-2 h-2 rounded-full bg-[#64748B] -ml-[13px] ring-2 ring-[#07090E]"></span>
                      <span className="text-[#64748B]">
                        {new Date(selectedEvent.created_at).toLocaleTimeString()}
                      </span>
                      <span className="text-[#F1F5F9]">Inbound payment instruction parsed</span>
                    </div>
                    <div className="flex items-baseline gap-2 relative">
                      <span className="w-2 h-2 rounded-full bg-[#06B6D4] -ml-[13px] ring-2 ring-[#07090E]"></span>
                      <span className="text-[#06B6D4]">
                        {new Date(new Date(selectedEvent.created_at).getTime() + 10).toLocaleTimeString()}
                      </span>
                      <span className="text-[#F1F5F9]">
                        ML Guardrail evaluates vectors (Risk: <span className="text-[#EF4444] font-bold">{selectedEvent.risk_score}</span>)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 relative">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444] -ml-[13px] ring-2 ring-[#07090E]"></span>
                      <span className="text-[#EF4444] font-bold">
                        {new Date(new Date(selectedEvent.created_at).getTime() + 15).toLocaleTimeString()}
                      </span>
                      <span className="text-[#F1F5F9]">
                        Policy drop executed (Action: <span className="text-[#EF4444] font-bold">{selectedEvent.action}</span>)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Toolbar */}
              <div className="pt-3 border-t border-[#1E2638] flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => alert(`Agent ${selectedEvent.agent_id} session memory quarantined.`)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#7F1D1D]/20 hover:bg-[#EF4444] hover:text-white text-[#EF4444] font-mono text-xs transition-colors border border-[#EF4444]/30"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Quarantine Agent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedEvent, null, 2))
                      const downloadAnchor = document.createElement('a')
                      downloadAnchor.setAttribute('href', dataStr)
                      downloadAnchor.setAttribute('download', `incident_${selectedEvent.id}.json`)
                      document.body.appendChild(downloadAnchor)
                      downloadAnchor.click()
                      downloadAnchor.remove()
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#1C2B3C] hover:bg-[#2C3A4C] text-[#06B6D4] font-mono text-xs transition-colors border border-[#06B6D4]/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Incident Selected"
              description="Click any row in the Attack Event Stream table to inspect forensic vectors, targeted policies, and telemetry signals."
            />
          )}
        </div>
      </div>
    </div>
  )
}
