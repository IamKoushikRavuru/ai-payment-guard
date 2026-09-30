import React, { useState } from 'react'
import { X, Play, RefreshCw, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react'
import { simulationApi } from '@/api/simulation'
import type { SimulationRunResult } from '@/types'

interface SimulationModalProps {
  isOpen: boolean
  onClose: () => void
  onSimulationComplete: () => void
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulationComplete,
}) => {
  const [scenarioType, setScenarioType] = useState<'mixed' | 'normal' | 'adversarial' | 'red_team'>('mixed')
  const [count, setCount] = useState<number>(10)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SimulationRunResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRun = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await simulationApi.run({
        scenario_type: scenarioType,
        count,
        random_seed: Math.floor(Math.random() * 1000),
      })
      setResult(res)
      onSimulationComplete()
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#11151F] border border-[#1E2638] rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2638] mb-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-[#06B6D4]" />
            <h3 className="text-base font-bold text-[#F1F5F9] font-sans">
              Traffic & Red-Team Attack Simulator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#94A3B8] font-mono mb-4">
          Dispatch synthetic or adversarial payment traffic through the live AI-Native security pipeline to test real-time detection, trigger alerts, and populate telemetry.
        </p>

        {/* Configuration */}
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-mono text-[#94A3B8] uppercase mb-1.5">
              Scenario Profile
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'mixed', label: 'Mixed Traffic (75% Clean / 25% Attack)' },
                { id: 'normal', label: '100% Compliant Cross-Border' },
                { id: 'adversarial', label: '100% Adversarial Attacks' },
                { id: 'red_team', label: 'Full 7-Vector Red-Team Test' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setScenarioType(opt.id as any)}
                  className={`p-2.5 rounded border text-left text-xs font-mono transition-all ${
                    scenarioType === opt.id
                      ? 'bg-[#1C2B3C] border-[#06B6D4] text-[#06B6D4] font-semibold'
                      : 'bg-[#0B0E14] border-[#1E2638] text-[#94A3B8] hover:border-[#2E3A52]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#94A3B8] uppercase mb-1.5">
              Batch Size ({count} transactions)
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-[#06B6D4] bg-[#0B0E14]"
            />
            <div className="flex justify-between font-mono text-[10px] text-[#64748B] mt-1">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded bg-[#7F1D1D]/30 border border-[#EF4444]/40 text-[#EF4444] text-xs font-mono">
            {error}
          </div>
        )}

        {/* Results summary if just run */}
        {result && (
          <div className="p-4 mb-4 rounded bg-[#0B0E14] border border-[#1E2638] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-[#10B981] font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Simulation Completed ({result.total_scenarios} transactions in {result.execution_duration_ms}ms)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1E2638] text-center">
              <div className="bg-[#11151F] p-2 rounded">
                <span className="text-[#94A3B8] text-[10px] uppercase">Approved</span>
                <p className="text-sm font-bold text-[#10B981]">{result.approved_count}</p>
              </div>
              <div className="bg-[#11151F] p-2 rounded">
                <span className="text-[#94A3B8] text-[10px] uppercase">Flagged</span>
                <p className="text-sm font-bold text-[#F59E0B]">{result.flagged_count}</p>
              </div>
              <div className="bg-[#11151F] p-2 rounded">
                <span className="text-[#94A3B8] text-[10px] uppercase">Blocked</span>
                <p className="text-sm font-bold text-[#EF4444]">{result.blocked_count}</p>
              </div>
              <div className="bg-[#11151F] p-2 rounded">
                <span className="text-[#94A3B8] text-[10px] uppercase">Alerts</span>
                <p className="text-sm font-bold text-[#06B6D4]">{result.alerts_triggered_approx}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#0B0E14] border border-[#1E2638] hover:bg-[#182030] text-[#94A3B8] font-mono text-xs transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleRun}
            className="flex items-center gap-2 px-5 py-2 rounded bg-[#06B6D4] hover:bg-[#4CD7F6] text-[#07090E] font-bold font-sans text-xs transition-colors disabled:opacity-50 shadow-md"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
