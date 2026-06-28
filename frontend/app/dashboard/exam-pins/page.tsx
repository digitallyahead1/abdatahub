'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import PinModal from '@/components/common/PinModal'

interface ExamPricing {
  id: string
  name: string
  price: number
  available: number
}

interface PurchasedPin {
  id: string
  pinCode: string
  serialNumber: string | null
  examType: string
  amountPaid: number
  soldAt: string
  category?: {
    name: string
  }
}

export default function BuyExamPinsPage() {
  const [activeTab, setActiveTab] = useState<'buy' | 'history'>('buy')
  
  // Buy tab states
  const [examType, setExamType] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [exams, setExams] = useState<ExamPricing[]>([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pendingData, setPendingData] = useState<any>(null)

  // Success Popup modal states
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successData, setSuccessData] = useState<{
    reference: string
    examType: string
    quantity: number
    pins: { pinCode: string; serialNumber: string | null }[]
  } | null>(null)

  // History tab states
  const [purchasedPins, setPurchasedPins] = useState<PurchasedPin[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchPricing = async () => {
    try {
      setExamsLoading(true)
      const response = await api.get('/services/exams/pricing')
      setExams(response.data.data)
    } catch (err) {
      console.error('Failed to fetch pricing:', err)
      toast.error('Unable to fetch results checker rates.')
    } finally {
      setExamsLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await api.get('/services/exams/my-pins')
      setPurchasedPins(response.data.data)
    } catch (err) {
      console.error('Failed to fetch purchase logs:', err)
      toast.error('Unable to fetch your purchased checker history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchPricing()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab])

  const selectedExam = exams.find((e) => e.id === examType)
  const totalCost = selectedExam ? selectedExam.price * quantity : 0
  const isOutOfStock = selectedExam ? selectedExam.available === 0 : false

  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!examType) {
      toast.error('Please select an exam checker category.')
      return
    }

    if (quantity < 1 || quantity > 10) {
      toast.error('Please specify a quantity between 1 and 10.')
      return
    }

    if (selectedExam && selectedExam.available < quantity) {
      toast.error(`Only ${selectedExam.available} checker pins remaining in stock.`)
      return
    }

    setPendingData({
      examType,
      quantity,
      amount: totalCost,
    })
    setPinModalOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    if (!pendingData) return
    setPurchaseLoading(true)
    try {
      const response = await api.post('/services/exam-pin', {
        ...pendingData,
        pin,
      })
      
      const resData = response.data.data
      setSuccessData(resData)
      setSuccessModalOpen(true)
      toast.success('Pins purchased successfully!')

      // Reset form
      setExamType('')
      setQuantity(1)
      setPinModalOpen(false)
      setPendingData(null)

      // Refresh pricing/stock info
      fetchPricing()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transaction failed. Check balance or try again.')
    } finally {
      setPurchaseLoading(false)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const filteredHistory = purchasedPins.filter((pin) => {
    const examName = pin.category?.name || pin.examType
    return (
      examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.pinCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pin.serialNumber && pin.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Exam Checker PINs</h1>
        <p className="text-sm text-silver-muted">
          Buy result checker tokens for WAEC, NECO, NBAIS, NABTEB, or JAMB instantly.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-silver-muted/10">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'buy'
              ? 'border-primary-glow text-white'
              : 'border-transparent text-silver-muted hover:text-white'
          }`}
        >
          Buy PINs
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-primary-glow text-white'
              : 'border-transparent text-silver-muted hover:text-white'
          }`}
        >
          My Purchased PINs
        </button>
      </div>

      {/* Tab: Buy PINs */}
      {activeTab === 'buy' && (
        <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-6 rounded-2xl glass-dark glow-blue">
          {examsLoading ? (
            <div className="py-12 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <form onSubmit={handleBuySubmit} className="space-y-5">
              {/* Category selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  Select Exam Category
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full bg-dark-bg border border-silver-muted/15 rounded-xl px-4 py-3.5 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
                >
                  <option value="">-- Choose Exam Category --</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id} disabled={ex.available === 0}>
                      {ex.name} - ₦{ex.price.toLocaleString()} ({ex.available > 0 ? `${ex.available} left` : 'OUT OF STOCK'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Stock Warning if selected category has low stock */}
              {selectedExam && (
                <div className={`p-4 rounded-xl flex justify-between items-center text-xs font-mono border ${
                  isOutOfStock 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : selectedExam.available < 5 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  <span>Current Inventory Status:</span>
                  <span className="font-bold uppercase">
                    {isOutOfStock ? '0 IN STOCK (Unavailable)' : `${selectedExam.available} IN STOCK`}
                  </span>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  Quantity (1 - 10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-dark-bg border border-silver-muted/15 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
                  disabled={isOutOfStock || !examType}
                />
              </div>

              {/* Cost Preview */}
              {examType && !isOutOfStock && (
                <div className="p-4 bg-white/5 border border-silver-muted/10 rounded-xl flex justify-between items-center text-sm font-semibold">
                  <span className="text-silver-muted">Total Charge:</span>
                  <span className="text-primary-glow font-mono text-lg">₦{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {/* Buy button */}
              <button
                type="submit"
                disabled={purchaseLoading || isOutOfStock || !examType}
                className="w-full py-3.5 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-40 text-sm flex items-center justify-center space-x-2"
              >
                {purchaseLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>Purchase Result Checker</span>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-3 rounded-xl glass-dark">
            <input
              type="text"
              placeholder="Search by Exam Body or PIN code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-bg border border-silver-muted/15 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary-glow text-xs"
            />
          </div>

          {/* Purchased cards list */}
          {historyLoading ? (
            <div className="py-20 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-16 text-center bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl text-silver-muted text-sm">
              No purchased results checker logs found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((pLog) => (
                <div
                  key={pLog.id}
                  className="p-5 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark hover:border-silver-muted/20 transition-all flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-gradient-blue text-white rounded text-[10px] font-bold uppercase tracking-wider">
                        {pLog.examType}
                      </span>
                      <span className="text-[10px] text-silver-muted font-mono">
                        {new Date(pLog.soldAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {pLog.category?.name || pLog.examType.toUpperCase() + ' Checker'}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                      <div>
                        <span className="text-silver-muted">PIN:</span>{' '}
                        <span className="font-mono text-primary-glow font-bold tracking-wide select-all">
                          {pLog.pinCode}
                        </span>
                      </div>
                      {pLog.serialNumber && (
                        <div>
                          <span className="text-silver-muted">Serial:</span>{' '}
                          <span className="font-mono text-white select-all">
                            {pLog.serialNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-between md:justify-center items-end md:items-end gap-2 shrink-0">
                    <span className="text-xs font-bold text-white font-mono">
                      ₦{Number(pLog.amountPaid).toLocaleString()}
                    </span>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => handleCopy(pLog.pinCode, 'PIN')}
                        className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[11px] font-bold rounded-lg transition-all"
                      >
                        Copy PIN
                      </button>
                      {pLog.serialNumber && (
                        <button
                          onClick={() => handleCopy(pLog.serialNumber!, 'Serial')}
                          className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[11px] font-bold rounded-lg transition-all"
                        >
                          Copy Serial
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transaction PIN Modal */}
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false)
          setPendingData(null)
        }}
        onConfirm={handlePinConfirm}
        loading={purchaseLoading}
      />

      {/* Successful Purchase Receipt Modal */}
      {successModalOpen && successData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-dark-bg-secondary border border-silver-muted/10 p-6 rounded-2xl max-w-md w-full glass-dark glow-blue shadow-2xl space-y-6 text-center animate-scale-in">
            {/* Header icon */}
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
              ✓
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Purchase Successful!</h2>
              <p className="text-xs text-silver-muted">
                Your checker card codes are ready. Copy them below to use.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 bg-white/5 border border-silver-muted/10 rounded-xl text-left space-y-2 text-xs font-mono text-silver-muted">
              <div className="flex justify-between">
                <span>Reference:</span>
                <span className="text-white select-all font-bold">{successData.reference}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="text-white uppercase font-bold">{successData.examType}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="text-white font-bold">{successData.quantity} Checker Card(s)</span>
              </div>
            </div>

            {/* Codes List */}
            <div className="space-y-3 text-left">
              <span className="text-xs font-bold text-silver-muted uppercase tracking-wider block">Generated Tokens</span>
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {successData.pins.map((pinObj, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-dark-bg border border-silver-muted/15 rounded-xl space-y-2.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-silver-muted font-bold">TOKEN #{idx + 1}</span>
                    </div>

                    <div className="space-y-2">
                      {/* PIN */}
                      <div className="flex justify-between items-center gap-4">
                        <div className="min-w-0">
                          <p className="text-[9px] text-silver-muted uppercase">PIN Code</p>
                          <p className="font-mono text-sm text-primary-glow font-black select-all tracking-wider truncate">
                            {pinObj.pinCode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(pinObj.pinCode, `PIN #${idx + 1}`)}
                          className="px-2.5 py-1 bg-gradient-blue text-white text-[10px] font-bold rounded-lg shadow-sm hover:opacity-90 transition-all shrink-0"
                        >
                          Copy PIN
                        </button>
                      </div>

                      {/* Serial (If Present) */}
                      {pinObj.serialNumber && (
                        <div className="flex justify-between items-center gap-4 pt-2 border-t border-silver-muted/5">
                          <div className="min-w-0">
                            <p className="text-[9px] text-silver-muted uppercase">Serial Number</p>
                            <p className="font-mono text-xs text-white select-all tracking-wider truncate">
                              {pinObj.serialNumber}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(pinObj.serialNumber!, `Serial #${idx + 1}`)}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-bold rounded-lg transition-all shrink-0"
                          >
                            Copy Serial
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom button */}
            <button
              onClick={() => {
                setSuccessModalOpen(false)
                setSuccessData(null)
                // Go to history tab to see it
                setActiveTab('history')
              }}
              className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              View Order History
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
