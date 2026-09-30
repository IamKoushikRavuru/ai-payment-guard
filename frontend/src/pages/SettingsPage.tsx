import React, { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Sliders,
  Terminal,
} from 'lucide-react'
import { systemApi } from '@/api/system'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { SystemHealth } from '@/types'

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pingLatency, setPingLatency] = useState<number | null>(null)
  const [isPinging, setIsPinging] = useState(false)

  const fetchHealth = async () => {
    setIsLoading(true)
    const startTime = performance.now()
    try {
      const res = await systemApi.getStatus()
      const endTime = performance.now()
      setHealth(res)
      setPingLatency(Math.round(endTime - startTime))
    } catch (err) {
      console.error('Failed to get system health', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const handleTestPing = async () => {
    setIsPinging(true)
    const startTime = performance.now()
    try {
      await systemApi.getHealth()
      const endTime = performance.now()
      setPingLatency(Math.round(endTime - startTime))
    } catch {
      setPingLatency(null)
    } finally {
      setIsPinging(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-[#06B6D4]" />
            System Configuration & Guardrail Policies
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 font-mono">
            Active AML corridor sanctions, detection thresholds & runtime telemetry parameters
          </p>
        </div>
        <button
          onClick={handleTestPing}
          disabled={isPinging}
          className="px-3 py-1.5 bg-[#11151F] border border-[#1E2638] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#06B6D4]/50 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <Radio className={`w-3.5 h-3.5 text-[#06B6D4] ${isPinging ? 'animate-ping' : ''}`} />
          {isPinging ? 'Pinging...' : 'Ping Gateway'}
        </button>
      </div>

      {/* Backend Operational Status Card */}
      <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#1E2638]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F1F5F9] flex items-center gap-2">
                AegisFlow Antigravity Core
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                  ONLINE
                </span>
              </h2>
              <span className="text-xs font-mono text-[#94A3B8]">
                Framework: FastAPI + PyTorch/Joblib ML Pipeline
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[#64748B] block">API Latency</span>
              <span className="text-[#10B981] font-bold">
                {pingLatency !== null ? `${pingLatency} ms` : 'Testing...'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#64748B] block">Database Engine</span>
              <span className="text-[#06B6D4] font-medium">Async SQLite (SQLAlchemy 2.0)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">Environment</span>
            <span className="text-xs font-mono font-medium text-[#F1F5F9] mt-1 block">
              Enterprise SOC Testbed
            </span>
          </div>
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">WebSocket Stream</span>
            <span className="text-xs font-mono font-medium text-[#10B981] mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              /ws/security-events
            </span>
          </div>
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">Model Weights Path</span>
            <span className="text-xs font-mono font-medium text-[#94A3B8] mt-1 block truncate">
              models/saved/*.joblib
            </span>
          </div>
          <div className="bg-[#11151F] border border-[#1E2638] p-3 rounded-lg">
            <span className="text-[10px] uppercase font-mono text-[#64748B] block">Multi-Turn Tracking</span>
            <span className="text-xs font-mono font-medium text-[#06B6D4] mt-1 block">
              v2.0 Stateful Sessions
            </span>
          </div>
        </div>
      </div>

      {/* Active Security Guardrails & Policy Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AML Corridor Policy */}
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-[#06B6D4]" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">
              Cross-Border Sanctions & Corridor Policy
            </h3>
          </div>
          <p className="text-xs text-[#94A3B8] mb-4 font-mono">
            Autonomous agent transactions to sanctioned jurisdictions trigger instant blocking and forensic alerts
          </p>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-[11px] text-[#EF4444] font-semibold block mb-1.5 uppercase tracking-wider">
                Sanctioned Destinations (OFAC Enforced — Zero Tolerance)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['IR (Iran)', 'KP (North Korea)', 'SY (Syria)', 'CU (Cuba)', 'RU (Russian Fed)'].map((c) => (
                  <span
                    key={c}
                    className="px-2 py-1 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[#EF4444] text-[11px]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-[#10B981] font-semibold block mb-1.5 uppercase tracking-wider">
                Approved Settlement Corridors (High Liquidity)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['US (FedNow/ACH)', 'GB (Faster Payments)', 'EU (SEPA Instant)', 'SG (FAST)', 'JP (Zengin)', 'CA (Lynx)'].map((c) => (
                  <span
                    key={c}
                    className="px-2 py-1 bg-[#10B981]/10 border border-[#10B981]/30 rounded text-[#10B981] text-[11px]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Thresholds & Model Parameters */}
        <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-[#06B6D4]" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">
              Risk Engine & Decision Thresholds
            </h3>
          </div>
          <p className="text-xs text-[#94A3B8] mb-4 font-mono">
            Mathematical parameters determining automated blocking vs dual-analyst review
          </p>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-[#11151F] border border-[#1E2638] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[#F1F5F9] font-medium block">
                  Prompt Injection Decision Boundary
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Calibrated to eliminate zero-shot FPR
                </span>
              </div>
              <span className="text-[#F59E0B] font-bold text-sm">0.80</span>
            </div>

            <div className="p-3 bg-[#11151F] border border-[#1E2638] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[#F1F5F9] font-medium block">
                  Autonomous Max Single Transaction
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Transactions above this require manual sign-off
                </span>
              </div>
              <span className="text-[#06B6D4] font-bold text-sm">$10,000 USD</span>
            </div>

            <div className="p-3 bg-[#11151F] border border-[#1E2638] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[#F1F5F9] font-medium block">
                  Agent Lockout Violation Threshold
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Automatic session freeze upon consecutive violations
                </span>
              </div>
              <span className="text-[#EF4444] font-bold text-sm">3 Violations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
