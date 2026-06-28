'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Transaction } from '@/types'
import TokenDisplayModal from '@/components/dashboard/TokenDisplayModal'
import TransactionReceiptModal from '@/components/dashboard/TransactionReceiptModal'

export default function UserTransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  // Token Modal State
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [selectedTokenTx, setSelectedTokenTx] = useState<Transaction | null>(null)

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/transactions')
      if (response.data?.success) {
        setTransactions(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err)
      toast.error('Unable to fetch your transaction history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const filtered = transactions.filter((tx) => {
    const matchesStatus = statusFilter ? tx.status === statusFilter : true
    const matchesService = serviceFilter ? tx.service === serviceFilter : true
    return matchesStatus && matchesService
  })

  const handleRetrieveToken = (tx: Transaction) => {
    setSelectedTokenTx(tx)
    setTokenModalOpen(true)
  }

  const handleViewReceipt = (tx: Transaction) => {
    setSelectedReceiptTx(tx)
    setReceiptModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Transaction History</h1>
          <p className="text-xs text-silver-muted">View all your transactions, orders, and receipts</p>
        </div>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 border border-silver-muted/15 hover:bg-white/5 rounded-xl text-xs font-semibold text-silver-light self-start sm:self-auto transition-all"
        >
          Refresh History
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-4 rounded-xl glass-dark flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-1 w-full sm:w-auto flex-1">
          <label className="block text-[10px] font-bold text-silver-muted uppercase tracking-wider">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-dark-bg border border-silver-muted/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-primary-glow"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="space-y-1 w-full sm:w-auto flex-1">
          <label className="block text-[10px] font-bold text-silver-muted uppercase tracking-wider">Filter by Service</label>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full bg-dark-bg border border-silver-muted/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-primary-glow"
          >
            <option value="">All Services</option>
            <option value="data">Data Subscription</option>
            <option value="airtime">Airtime Recharge</option>
            <option value="electricity">Electricity Bill</option>
            <option value="cable">Cable TV</option>
            <option value="exam-pin">Exam Pin</option>
            <option value="deposit">Deposit / funding</option>
            <option value="reversal">Reversals</option>
          </select>
        </div>
      </div>

      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-silver-muted space-y-2">
            <span className="text-4xl">🤷‍♂️</span>
            <p className="text-sm">No transaction records found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-silver-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date / Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((tx) => {
                  const hasToken = tx.service === 'electricity' && tx.status === 'success' && tx.metadata?.token
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-primary-glow select-all">
                        {tx.reference}
                      </td>
                      <td className="px-6 py-4 font-semibold text-white capitalize">
                        {tx.service}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          tx.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : tx.status === 'failed'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-mono ${tx.status === 'failed' ? 'text-silver-muted line-through font-normal' : tx.type === 'credit' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}`}>
                        {tx.status === 'failed' ? '' : tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-silver-muted">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Receipt button - always visible */}
                          <button
                            onClick={() => handleViewReceipt(tx)}
                            className="px-3 py-1.5 bg-primary-glow/10 border border-primary-glow/20 text-primary-glow hover:bg-primary-glow/20 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                            title="View Receipt"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Receipt
                          </button>

                          {/* Retrieve Token button - only for electricity with token */}
                          {hasToken && (
                            <button
                              onClick={() => handleRetrieveToken(tx)}
                              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              Retrieve Token
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Token Display Modal */}
      <TokenDisplayModal
        isOpen={tokenModalOpen}
        onClose={() => {
          setTokenModalOpen(false)
          setSelectedTokenTx(null)
        }}
        token={selectedTokenTx?.metadata?.token || ''}
        units={selectedTokenTx?.metadata?.units}
        band={selectedTokenTx?.metadata?.band}
        customerName={selectedTokenTx?.metadata?.customerName}
        amount={selectedTokenTx?.amount}
        meterNumber={selectedTokenTx?.metadata?.meterNumber}
        disco={selectedTokenTx?.metadata?.disco}
      />

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false)
          setSelectedReceiptTx(null)
        }}
        transaction={selectedReceiptTx}
      />
    </div>
  )
}
