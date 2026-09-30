import React, { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  CreditCard,
  EyeOff,
  FileText,
  Lock,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { securityApi } from '@/api/security'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { MetricCard } from '@/components/common/MetricCard'
import { RiskBadge } from '@/components/common/RiskBadge'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import type { ResponseScanResult, SecurityEvent } from '@/types'

export const DataProtectionPage: React.FC = () => {
  const [dlpEvents, setDlpEvents] = useState<SecurityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Interactive DLP tester state
  const [testPayload, setTestPayload] = useState(
    'Agent response: Please confirm settlement of $4,500 using corporate Visa card 4111111111111111 expiring 12/28 with CVV 891.'
  )
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ResponseScanResult | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchDlpEvents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await securityApi.listEvents({ limit: 100 })
      const rawEvents: SecurityEvent[] = res.items || res.events || []
      // Filter for DLP / Sensitive Data events
      const dlp = rawEvents.filter(
        (e: SecurityEvent) =>
          e.event_type.includes('DLP') ||
          e.event_type.includes('SENSITIVE_DATA') ||
          (e.details && (e.details.dlp_violations || e.details.findings))
      )
      setDlpEvents(dlp)
    } catch (err: any) {
      console.error('Failed to load DLP events', err)
      setError(err?.message || 'Failed to connect to security events API.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDlpEvents()
  }, [])

  const handleTestScan = async () => {
    if (!testPayload.trim()) return
    setIsScanning(true)
    try {
      const res = await securityApi.scanResponse(testPayload)
      setScanResult(res)
    } catch (err: any) {
      console.error('Failed to run DLP scan', err)
    } finally {
      setIsScanning(false)
    }
  }

  const handleCopyRedacted = () => {
    const textToCopy = scanResult?.masked_response || scanResult?.redacted_text
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const filteredEvents = dlpEvents.filter(
    (e) =>
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(e.details || {}).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalDlpDetections = dlpEvents.length
  const criticalDlpCount = dlpEvents.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH').length
  const hasViolations = scanResult ? (scanResult.sensitive_data_detected || scanResult.has_dlp_violations) : false
  const maskedOutput = scanResult ? (scanResult.masked_response || scanResult.redacted_text || '') : ''

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-[#06B6D4]" />
            Data Protection & DLP (PCI-DSS)
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 font-mono">
            Zero-leakage PAN detection, Luhn checksum verification & real-time automated redaction
          </p>
        </div>
        <button
          onClick={fetchDlpEvents}
          className="px-3 py-1.5 bg-[#11151F] border border-[#1E2638] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#06B6D4]/50 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Audit Trail
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total PAN Interceptions"
          value={totalDlpDetections.toString()}
          badgeText="Luhn Validated"
          badgeVariant="cyan"
          icon={<CreditCard className="w-5 h-5 text-[#06B6D4]" />}
        />
        <MetricCard
          label="High Severity Exfiltrations"
          value={criticalDlpCount.toString()}
          subtext="Cardholders protected"
          badgeText={criticalDlpCount > 0 ? 'Action Required' : 'Zero Leaks'}
          badgeVariant={criticalDlpCount > 0 ? 'red' : 'green'}
          icon={<ShieldAlert className="w-5 h-5 text-[#EF4444]" />}
        />
        <MetricCard
          label="PAN Masking Format"
          value="FPE / Tokenized"
          subtext="Format: ************1111"
          badgeText="PCI-DSS 4.0"
          badgeVariant="green"
          icon={<EyeOff className="w-5 h-5 text-[#10B981]" />}
        />
        <MetricCard
          label="Enforcement Mode"
          value="Inline Redact"
          subtext="Zero raw PANs stored"
          badgeText="Active"
          badgeVariant="cyan"
          icon={<ShieldCheck className="w-5 h-5 text-[#06B6D4]" />}
        />
      </div>

      {/* Interactive DLP Test Suite */}
      <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4]">
              <EyeOff className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-semibold text-[#F1F5F9]">
              Live Agent Output Sanitizer & Luhn Validator
            </h2>
          </div>
          <span className="text-xs font-mono text-[#64748B]">POST /api/v1/security/scan-response</span>
        </div>

        <p className="text-xs text-[#94A3B8] mb-4">
          Test real-time PAN masking on simulated autonomous agent replies. The backend executes regex pattern matching and Luhn algorithm validation to prevent card data exposure.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input text */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-[#94A3B8] block">
              Agent Raw Output / Payload:
            </label>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={4}
              placeholder="Paste text with raw card numbers or confidential instructions..."
              className="w-full bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-[#F1F5F9] font-mono text-xs rounded-lg p-3 outline-none resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[#64748B] font-mono">
                Sample: Visa (4532...), MC (5424...), Amex (3782...)
              </span>
              <button
                onClick={handleTestScan}
                disabled={isScanning || !testPayload.trim()}
                className="px-4 py-1.5 bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-[#07090E] font-medium text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Execute DLP Scan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sanitized output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-[#94A3B8] block">
                Sanitized & Redacted Output:
              </label>
              {scanResult && (
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                    hasViolations
                      ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                      : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                  }`}
                >
                  {hasViolations
                    ? `${scanResult.data_types?.join(', ') || 'PAN'} INTERCEPTED`
                    : 'CLEAN PAYLOAD'}
                </span>
              )}
            </div>

            <div className="relative min-h-[96px] bg-[#11151F] border border-[#1E2638] rounded-lg p-3 font-mono text-xs text-[#F1F5F9]">
              {scanResult ? (
                <>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {maskedOutput}
                  </p>
                  <button
                    onClick={handleCopyRedacted}
                    className="absolute top-2 right-2 p-1.5 bg-[#182030] hover:bg-[#1E2638] text-[#94A3B8] hover:text-[#F1F5F9] rounded border border-[#1E2638] transition-colors"
                    title="Copy sanitized output"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </>
              ) : (
                <span className="text-[#64748B] italic">
                  Run a scan above to see live redaction output.
                </span>
              )}
            </div>

            {/* Findings breakdown */}
            {scanResult && Array.isArray(scanResult.details) && scanResult.details.length > 0 && (
              <div className="p-2.5 bg-[#182030]/60 border border-[#1E2638] rounded-lg space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B] block">
                  Detection Details
                </span>
                <div className="flex flex-wrap gap-2">
                  {scanResult.details.map((d: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[11px] font-mono text-[#EF4444]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F1F5F9] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#06B6D4]" />
              PCI-DSS DLP Audit Log
            </h3>
            <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
              Historical record of sensitive data redactions and policy enforcements
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search DLP audit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-xs font-mono text-[#F1F5F9] rounded-lg outline-none placeholder-[#64748B]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton variant="table" count={5} />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No DLP Interceptions Found"
              description={
                searchTerm
                  ? `No audit logs match '${searchTerm}'.`
                  : 'No payment card disclosures or sensitive information leakage detected in the monitored pipeline.'
              }
              icon={<ShieldCheck className="w-8 h-8 text-[#10B981]" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2638] bg-[#11151F]/40 text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Event ID</th>
                  <th className="py-2.5 px-4">Target Agent</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Risk Score</th>
                  <th className="py-2.5 px-4">Payload Snippet / Findings</th>
                  <th className="py-2.5 px-4 text-right">Policy Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]/50 text-xs">
                {filteredEvents.map((evt) => {
                  const timestampStr = evt.created_at || evt.timestamp || new Date().toISOString()
                  const payload = evt.payload_snippet || evt.description || '************1111'

                  return (
                    <tr key={evt.id} className="hover:bg-[#11151F]/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#94A3B8] whitespace-nowrap">
                        {new Date(timestampStr).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#06B6D4] font-medium">
                        {evt.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#F1F5F9]">
                        {evt.agent_id}
                      </td>
                      <td className="py-3 px-4">
                        <SeverityBadge severity={evt.severity} />
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge score={evt.risk_score} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8] max-w-xs truncate">
                        <span className="text-[#10B981] font-semibold">{payload}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                          {evt.action || evt.action_taken || 'REDACTED'}
                        </span>
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
