'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Transaction } from '@/types'
import TokenDisplayModal from '@/components/dashboard/TokenDisplayModal'
import TransactionReceiptModal from '@/components/dashboard/TransactionReceiptModal'

const STORAGE_KEY = 'ab_tx_search_history'
const POPULAR_NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE']

export default function UserTransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  // Search and Search History State
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Token Modal State
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [selectedTokenTx, setSelectedTokenTx] = useState<Transaction | null>(null)

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')

  // Load Search History from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 8))
        }
      }
    } catch {
      // Ignore localStorage error
    }
  }, [])

  const saveSearchToHistory = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed || trimmed.length < 2) return

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
      const updated = [trimmed, ...filtered].slice(0, 8)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore
      }
      return updated
    })
  }

  const removeSearchHistoryItem = (itemToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== itemToRemove.toLowerCase())
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore
      }
      return updated
    })
  }

  const clearSearchHistory = () => {
    setRecentSearches([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }

  const handleApplySearch = (query: string) => {
    setSearchInput(query)
    setSearchQuery(query.trim())
    if (query.trim()) {
      saveSearchToHistory(query.trim())
    }
  }

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    handleApplySearch(searchInput)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

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

  // Comprehensive multi-field filtering (Phone, Reference, Network, Service)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const digitsOnlyQuery = normalizedQuery.replace(/\D/g, '')

  const filtered = transactions.filter((tx) => {
    const matchesStatus = statusFilter ? tx.status === statusFilter : true
    const matchesService = serviceFilter ? tx.service === serviceFilter : true
    if (!matchesStatus || !matchesService) return false

    if (!normalizedQuery) return true

    // 1. Match Reference (case-insensitive)
    if (tx.reference?.toLowerCase().includes(normalizedQuery)) return true
    if (tx.metadata?.originalReference?.toLowerCase().includes(normalizedQuery)) return true

    // 2. Match Phone Number (handling unformatted digits and substrings)
    const phone = tx.metadata?.phoneNumber || tx.metadata?.phone || tx.metadata?.recipient || ''
    const phoneStr = String(phone).toLowerCase()
    const cleanPhone = phoneStr.replace(/\D/g, '')

    if (phoneStr.includes(normalizedQuery)) return true
    if (cleanPhone && digitsOnlyQuery && (cleanPhone.includes(digitsOnlyQuery) || digitsOnlyQuery.includes(cleanPhone))) {
      return true
    }

    // 3. Match Network Provider
    const network = tx.metadata?.network || tx.metadata?.provider || tx.metadata?.operator || tx.metadata?.disco || ''
    if (String(network).toLowerCase().includes(normalizedQuery)) return true

    // 4. Match Other Identifiers (Meter Number, SmartCard, Plan Name, Token)
    const meter = tx.metadata?.meterNumber || tx.metadata?.meter || ''
    if (String(meter).toLowerCase().includes(normalizedQuery)) return true

    const smartCard = tx.metadata?.smartCardNumber || tx.metadata?.cardNumber || ''
    if (String(smartCard).toLowerCase().includes(normalizedQuery)) return true

    const planName = tx.metadata?.planName || tx.metadata?.packageName || ''
    if (String(planName).toLowerCase().includes(normalizedQuery)) return true

    // 5. Match Service Name
    if (tx.service?.toLowerCase().includes(normalizedQuery)) return true

    return false
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
          <p className="text-xs text-silver-muted">Search orders by phone number, reference, or network</p>
        </div>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 border border-silver-muted/15 hover:bg-white/5 rounded-xl text-xs font-semibold text-silver-light self-start sm:self-auto transition-all flex items-center gap-2"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh History
        </button>
      </div>

      {/* Main Search and History Card */}
      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-4 sm:p-5 rounded-2xl glass-dark space-y-4">
        {/* Search Bar Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-silver-muted">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setSearchQuery(e.target.value.trim())
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearchSubmit()
                }
              }}
              placeholder="Search by phone number, reference, or network..."
              className="w-full bg-dark-bg border border-silver-muted/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-silver-muted/60 focus:outline-none focus:border-primary-glow focus:ring-1 focus:ring-primary-glow/30 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-silver-muted hover:text-white transition-colors"
                title="Clear search input"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-blue text-white font-bold rounded-xl text-xs hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 shadow-glow-blue-sm"
          >
            Search
          </button>
        </form>

        {/* Search History & Quick Filters */}
        <div className="space-y-2 pt-1 border-t border-white/5">
          {/* Recent Search History Chips */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-silver-muted flex items-center gap-1 mr-1">
                <svg className="w-3.5 h-3.5 text-silver-muted/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent:
              </span>
              {recentSearches.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplySearch(item)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-all border ${
                    searchQuery.toLowerCase() === item.toLowerCase()
                      ? 'bg-primary-glow/20 border-primary-glow text-primary-glow font-bold'
                      : 'bg-white/5 border-silver-muted/10 text-silver-light hover:bg-white/10 hover:border-silver-muted/20'
                  }`}
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={(e) => removeSearchHistoryItem(item, e)}
                    className="text-silver-muted hover:text-white p-0.5"
                    title="Remove from history"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={clearSearchHistory}
                className="text-[10px] text-silver-muted hover:text-red-400 transition-colors ml-auto font-semibold px-1 py-0.5"
              >
                Clear History
              </button>
            </div>
          )}

          {/* Quick Network Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-silver-muted mr-1">Networks:</span>
            {POPULAR_NETWORKS.map((net) => {
              const isActive = searchQuery.toLowerCase() === net.toLowerCase()
              return (
                <button
                  key={net}
                  type="button"
                  onClick={() => handleApplySearch(isActive ? '' : net)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    isActive
                      ? 'bg-primary-glow border-primary-glow text-white font-bold'
                      : 'bg-white/5 border-silver-muted/10 text-silver-muted hover:text-white hover:bg-white/10'
                  }`}
                >
                  {net}
                </button>
              )
            })}
          </div>
        </div>

        {/* Dropdown Filters (Status and Service) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div className="space-y-1">
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

          <div className="space-y-1">
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
      </div>

      {/* Active Filter Summary Bar */}
      {(searchQuery || statusFilter || serviceFilter) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-primary-glow/10 border border-primary-glow/20 rounded-xl text-xs text-silver-light">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary-glow">Active Filter:</span>
            {searchQuery && (
              <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[11px]">
                Search: &quot;{searchQuery}&quot;
              </span>
            )}
            {statusFilter && (
              <span className="bg-white/10 px-2 py-0.5 rounded text-white capitalize text-[11px]">
                Status: {statusFilter}
              </span>
            )}
            {serviceFilter && (
              <span className="bg-white/10 px-2 py-0.5 rounded text-white capitalize text-[11px]">
                Service: {serviceFilter}
              </span>
            )}
            <span className="text-silver-muted ml-2">
              ({filtered.length} {filtered.length === 1 ? 'record' : 'records'} found)
            </span>
          </div>

          <button
            onClick={() => {
              handleClearSearch()
              setStatusFilter('')
              setServiceFilter('')
            }}
            className="text-xs text-primary-glow hover:underline font-bold"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Transactions Table Card */}
      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-silver-muted space-y-3 px-4">
            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-silver-muted">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">No transactions found</p>
              {searchQuery ? (
                <p className="text-xs text-silver-muted mt-1 max-w-sm mx-auto">
                  No records matched &quot;<span className="text-primary-glow font-mono">{searchQuery}</span>&quot;. Try searching with a phone number, transaction reference, or network name (e.g. MTN, Airtel).
                </p>
              ) : (
                <p className="text-xs text-silver-muted mt-1">No transactions match your current status or service filters.</p>
              )}
            </div>
            {(searchQuery || statusFilter || serviceFilter) && (
              <button
                onClick={() => {
                  handleClearSearch()
                  setStatusFilter('')
                  setServiceFilter('')
                }}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-semibold transition-all"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-silver-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Service &amp; Recipient</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date / Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((tx) => {
                  const hasToken = tx.service === 'electricity' && tx.status === 'success' && tx.metadata?.token
                  const recipient = tx.metadata?.phoneNumber || tx.metadata?.phone || tx.metadata?.recipient || tx.metadata?.meterNumber || tx.metadata?.smartCardNumber
                  const network = tx.metadata?.network || tx.metadata?.provider || tx.metadata?.operator || tx.metadata?.disco

                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-primary-glow select-all">
                        {tx.reference}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white capitalize">{tx.service}</span>
                          {network && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-glow/15 text-primary-glow uppercase">
                              {network}
                            </span>
                          )}
                        </div>
                        {recipient && (
                          <div className="text-[11px] text-silver-muted font-mono mt-0.5">
                            {recipient}
                          </div>
                        )}
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
                        {new Date(tx.createdAt).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Receipt button */}
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

                          {/* Retrieve Token button */}
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
