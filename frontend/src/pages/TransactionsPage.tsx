import React, { useState, useEffect, useCallback } from 'react'
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { transactionsApi } from '@/api/transactions'
import { RiskBadge } from '@/components/common/RiskBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DetailDrawer } from '@/components/common/DetailDrawer'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import type { Transaction } from '@/types'

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 20

  const loadTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await transactionsApi.list({
        limit: pageSize,
        offset: page * pageSize,
      })
      setTransactions(res.items)
      setTotalCount(res.total)
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const filteredTransactions = transactions.filter((t) => {
    const matchesStatus =
      statusFilter === 'ALL' || t.status === statusFilter
    const matchesSearch =
      !searchQuery ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination_country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.route.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#F1F5F9] tracking-tight font-sans">
            Payment Transaction Ledger
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono">
            Audited financial instruction pipeline with zero-trust validation and deterministic verification
          </p>
        </div>

        <button
          onClick={loadTransactions}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#11151F] hover:bg-[#182030] text-[#06B6D4] font-mono text-xs border border-[#06B6D4]/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 rounded-xl bg-[#0B0E14] border border-[#1E2638]">
        <div className="md:col-span-7 flex items-center bg-[#11151F] rounded-lg px-3 py-1.5 border border-[#1E2638]">
          <Search className="w-4 h-4 text-[#64748B] mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Transaction ID, User, Country, Corridor..."
            className="w-full bg-transparent font-mono text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none"
          />
        </div>

        <div className="md:col-span-5 flex items-center bg-[#11151F] rounded-lg px-3 py-1.5 justify-between border border-[#1E2638]">
          <span className="font-mono text-[10px] text-[#64748B] uppercase">STATUS:</span>
          <div className="flex items-center gap-1">
            {(['ALL', 'APPROVED', 'FLAGGED', 'BLOCKED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                  statusFilter === st
                    ? 'bg-[#06B6D4] text-[#07090E] font-bold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Shell */}
      <div className="bg-[#11151F] border border-[#1E2638] rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-[#0B0E14] text-[#64748B] font-mono text-[10px] uppercase tracking-wider border-b border-[#1E2638]">
                <th className="py-3 px-3.5">Transaction ID</th>
                <th className="py-3 px-3.5">Timestamp (UTC)</th>
                <th className="py-3 px-3.5">Origin User</th>
                <th className="py-3 px-3.5">Amount Sent</th>
                <th className="py-3 px-3.5">Destination</th>
                <th className="py-3 px-3.5">Corridor</th>
                <th className="py-3 px-3.5 text-center">Risk Score</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638]/40">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-4">
                    <LoadingSkeleton rows={5} height="h-10" />
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B] font-mono">
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-[#182030] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-[#06B6D4]">
                      {tx.id}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#94A3B8]">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#F1F5F9]">{tx.user_id}</td>
                    <td className="py-3 px-3.5 font-mono font-bold text-[#F1F5F9]">
                      {tx.source_currency} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#F1F5F9]">
                      {tx.destination_country} ({tx.destination_currency})
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#94A3B8]">{tx.route}</td>
                    <td className="py-3 px-3.5 text-center">
                      <RiskBadge score={tx.risk_score} size="sm" />
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-[#94A3B8]">
                      {tx.execution_latency_ms}ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-[#0B0E14] border-t border-[#1E2638] flex items-center justify-between text-xs font-mono text-[#94A3B8]">
          <span>
            Showing {filteredTransactions.length} of {totalCount} transactions
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1 rounded bg-[#11151F] border border-[#1E2638] disabled:opacity-40 hover:bg-[#182030] text-[#F1F5F9]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {page + 1}</span>
            <button
              disabled={(page + 1) * pageSize >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 rounded bg-[#11151F] border border-[#1E2638] disabled:opacity-40 hover:bg-[#182030] text-[#F1F5F9]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title={selectedTx ? `Transaction ${selectedTx.id}` : ''}
        subtitle={selectedTx?.user_id}
        badge={selectedTx && <StatusBadge status={selectedTx.status} />}
      >
        {selectedTx && (
          <div className="space-y-4 font-mono text-xs">
            {/* Key figures */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded bg-[#0B0E14] border border-[#1E2638]">
                <span className="text-[#64748B] text-[10px] uppercase block">Sent Amount</span>
                <span className="text-base font-bold text-[#F1F5F9]">
                  {selectedTx.source_currency} {selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded bg-[#0B0E14] border border-[#1E2638]">
                <span className="text-[#64748B] text-[10px] uppercase block">Converted Payout</span>
                <span className="text-base font-bold text-[#06B6D4]">
                  {selectedTx.destination_currency} {selectedTx.destination_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Audit Metadata */}
            <div className="p-3 rounded bg-[#0B0E14] border border-[#1E2638] space-y-2">
              <div className="flex justify-between pb-1.5 border-b border-[#1E2638]">
                <span className="text-[#64748B]">Market Exchange Rate:</span>
                <span className="text-[#F1F5F9] font-bold">{selectedTx.exchange_rate}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-[#1E2638]">
                <span className="text-[#64748B]">Destination Corridor:</span>
                <span className="text-[#F1F5F9]">{selectedTx.route} ({selectedTx.destination_country})</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-[#1E2638]">
                <span className="text-[#64748B]">Risk Score:</span>
                <RiskBadge score={selectedTx.risk_score} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Execution Latency:</span>
                <span className="text-[#10B981]">{selectedTx.execution_latency_ms} ms</span>
              </div>
            </div>

            {/* Decision explanation */}
            <div className="p-3 rounded bg-[#0B0E14] border border-[#1E2638]">
              <span className="text-[#64748B] text-[10px] uppercase block mb-1">
                Risk Engine Decision Reason
              </span>
              <p className="text-xs text-[#F1F5F9] leading-relaxed">
                {selectedTx.decision_reason || 'All security and financial checks cleared.'}
              </p>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}
