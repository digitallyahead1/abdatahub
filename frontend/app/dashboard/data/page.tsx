'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dataTransactionSchema, DataTransactionInput } from '@/lib/validators'
import api from '@/lib/api'
import { toast } from 'sonner'
import PinModal from '@/components/common/PinModal'

type NetworkType = 'mtn' | 'airtel' | 'glo' | '9mobile'

interface DataPlan {
  id: string
  smeplugPlanId: number
  network: string
  bundleName: string
  sellingPrice: number
}

// Helpers for plan parsing and badge styling
const parsePlan = (bundleName: string) => {
  const name = bundleName.trim()
  
  // Extract size (e.g. "1.5GB", "500MB", "2GB")
  const sizeMatch = name.match(/(\d+(?:\.\d+)?)\s*(GB|MB|TB)/i)
  let size = ''
  if (sizeMatch) {
    const num = parseFloat(sizeMatch[1])
    const unit = sizeMatch[2].toUpperCase()
    size = `${num}${unit}`
  } else {
    size = name.split('-')[0].trim()
  }

  // Extract Plan Type (SME, CG, Gifting, Direct, etc.)
  let type = ''
  const upperName = name.toUpperCase()
  if (upperName.includes('SME')) {
    type = 'SME'
  } else if (upperName.includes('CORPORATE GIFTING') || upperName.includes('CORP GIFTING') || upperName.includes(' CG')) {
    type = 'CG'
  } else if (upperName.includes('GIFTING')) {
    type = 'Gifting'
  } else if (upperName.includes('DIRECT') || upperName.includes('DG')) {
    type = 'Direct'
  } else {
    // Look for uppercase abbreviation of 2-4 letters (e.g. SME, CG, DG)
    const typeMatch = name.match(/\b([A-Z]{2,4})\b/)
    type = typeMatch ? typeMatch[1] : 'Data'
  }

  // Extract Validity
  const validityMatch = name.match(/(\d+)\s*(day|month|week|hr|hour)s?/i)
  let validity = '30 Days'
  if (validityMatch) {
    validity = `${validityMatch[1]} ${validityMatch[2].charAt(0).toUpperCase() + validityMatch[2].slice(1).toLowerCase()}${parseInt(validityMatch[1]) > 1 ? 's' : ''}`
  } else {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('monthly')) {
      validity = '30 Days'
    } else if (lowerName.includes('weekly')) {
      validity = '7 Days'
    } else if (lowerName.includes('daily')) {
      validity = '1 Day'
    }
  }

  return { size, type, validity }
}

const getTypeBadgeStyles = (type: string) => {
  switch (type.toUpperCase()) {
    case 'SME':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    case 'CG':
    case 'CORPORATE':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    case 'GIFTING':
      return 'bg-green-500/10 text-green-400 border border-green-500/20'
    case 'DIRECT':
    case 'DG':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    default:
      return 'bg-silver-muted/10 text-silver-muted border border-silver-muted/20'
  }
}

export default function BuyDataPage() {
  const [activeNetwork, setActiveNetwork] = useState<NetworkType>('mtn')
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<DataPlan[]>([])
  const [fetchingPlans, setFetchingPlans] = useState(true)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pendingData, setPendingData] = useState<DataTransactionInput | null>(null)
  const [selectedType, setSelectedType] = useState<string>('All')
  const [receipt, setReceipt] = useState<{
    planName: string
    phoneNumber: string
    amount: number
    reference: string
    network: string
    status: string
  } | null>(null)
  const [failedReceipt, setFailedReceipt] = useState<{
    planName: string
    phoneNumber: string
    amount: number
    errorMessage: string
    network: string
  } | null>(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setFetchingPlans(true)
        const response = await api.get('/services/data/plans')
        setPlans(response.data.data)
      } catch (err) {
        console.error('Failed to load data plans:', err)
        toast.error('Could not retrieve data plans. Please try again later.')
      } finally {
        setFetchingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DataTransactionInput>({
    resolver: zodResolver(dataTransactionSchema),
    defaultValues: {
      network: 'mtn',
      amount: 0,
    },
  })

  const selectedPlanId = watch('planId')

  const handleDownloadReceiptPdf = async (rcpt: any) => {
    try {
      const jspdf = await new Promise<any>((resolve, reject) => {
        if ((window as any).jspdf) {
          resolve((window as any).jspdf)
          return
        }
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        script.onload = () => resolve((window as any).jspdf)
        script.onerror = reject
        document.head.appendChild(script)
      })

      const doc = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150]
      })

      // Frame
      doc.setDrawColor(200, 200, 200)
      doc.rect(2, 2, 76, 146)

      // Header
      doc.setTextColor(0, 102, 204)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('AB DATA HUB', 40, 15, { align: 'center' })

      doc.setTextColor(100, 100, 100)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(8)
      doc.text('TRANSACTION RECEIPT', 40, 20, { align: 'center' })

      doc.setLineDashPattern([1.5, 1.5], 0)
      doc.line(5, 25, 75, 25)

      doc.setFontSize(9)
      doc.setTextColor(50, 50, 50)

      const rows = [
        ['Phone Number', rcpt.phoneNumber],
        ['Network', rcpt.network.toUpperCase()],
        ['Plan', rcpt.planName],
        ['Amount Paid', `NGN ${Number(rcpt.amount).toLocaleString()}`],
        ['Reference', rcpt.reference],
        ['Status', 'SUCCESSFUL']
      ]

      let y = 35
      rows.forEach(([label, val]) => {
        doc.setFont('Helvetica', 'bold')
        doc.text(label + ':', 6, y)
        doc.setFont('Helvetica', 'normal')
        if (label === 'Reference') {
          doc.setFontSize(7.5)
        } else {
          doc.setFontSize(9)
        }
        doc.text(String(val), 74, y, { align: 'right' })
        doc.setFontSize(9)
        y += 11
      })

      doc.setLineDashPattern([1.5, 1.5], 0)
      doc.line(5, 105, 75, 105)

      doc.setFont('Helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(120, 120, 120)
      doc.text('Thank you for choosing AB Data Hub!', 40, 115, { align: 'center' })
      doc.text('For support, visit support@abdatahub.com', 40, 120, { align: 'center' })

      doc.save(`receipt_${rcpt.reference}.pdf`)
      toast.success('PDF Receipt downloaded successfully!')
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      toast.error('Could not generate PDF receipt.')
    }
  }

  const handleNetworkChange = (net: NetworkType) => {
    setActiveNetwork(net)
    setValue('network', net)
    setValue('planId', '')
    setValue('amount', 0)
    setSelectedType('All')
  }

  const handleCardClick = (planId: string) => {
    setValue('planId', planId, { shouldValidate: true })
    const selected = plans.find((p) => p.id === planId)
    if (selected) {
      setValue('amount', Number(selected.sellingPrice))
    }
  }

  const onSubmit = async (data: DataTransactionInput) => {
    setPendingData(data)
    setPinModalOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    if (!pendingData) return
    // Capture ALL needed values in local consts BEFORE any setState calls
    const capturedPending = pendingData
    const selectedPlan = plans.find((p) => p.id === capturedPending.planId)
    setLoading(true)
    try {
      const payload = {
        phoneNumber: capturedPending.phoneNumber,
        network: capturedPending.network,
        planId: selectedPlan?.id,
        amount: capturedPending.amount,
        pin,
      }
      
      const response = await api.post('/services/data', payload)
      const data = response.data.data

      // Close modal and clear form state
      setPinModalOpen(false)
      setPendingData(null)
      setValue('planId', '')
      setValue('amount', 0)

      // Show success receipt popup
      setReceipt({
        planName: data?.planName || selectedPlan?.bundleName || 'Data Plan',
        phoneNumber: data?.phoneNumber || capturedPending.phoneNumber,
        amount: Number(data?.amount ?? capturedPending.amount),
        reference: data?.reference || 'N/A',
        network: (data?.network || capturedPending.network).toUpperCase(),
        status: data?.status || 'success',
      })
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Transaction failed. Please try again.'
      // Show failure receipt popup instead of just a toast
      setFailedReceipt({
        planName: selectedPlan?.bundleName || 'Data Plan',
        phoneNumber: capturedPending.phoneNumber,
        amount: Number(capturedPending.amount),
        errorMessage: errMsg,
        network: capturedPending.network.toUpperCase(),
      })
      setPinModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const activePlans = plans.filter((p) => p.network === activeNetwork)

  const parsedActivePlans = activePlans.map((plan) => ({
    ...plan,
    parsed: parsePlan(plan.bundleName),
  }))

  const availableTypes = ['All', ...Array.from(new Set(parsedActivePlans.map((p) => p.parsed.type)))]

  const filteredPlans = selectedType === 'All'
    ? parsedActivePlans
    : parsedActivePlans.filter((p) => p.parsed.type === selectedType)

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Purchase Mobile Data</h1>
        <p className="text-sm text-silver-muted">
          Buy cheap automated data bundles instantly
        </p>
      </div>

      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-6 rounded-2xl glass-dark glow-blue">
        {/* Network Selection tabs */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {(['mtn', 'airtel', 'glo', '9mobile'] as NetworkType[]).map((net) => (
            <button
              key={net}
              type="button"
              onClick={() => handleNetworkChange(net)}
              className={`py-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                activeNetwork === net
                  ? 'bg-gradient-blue border-primary-glow text-white shadow-glow-blue'
                  : 'bg-white/5 border-silver-muted/10 text-silver-muted hover:text-white'
              }`}
            >
              {net}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Phone Number */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="text"
              {...register('phoneNumber')}
              placeholder="e.g. 08012345678"
              className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
            />
            {errors.phoneNumber && (
              <p className="text-xs text-red-400 font-medium">{errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Data Plans Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider mb-2">
              Select Data Plan
            </label>
            
            <input type="hidden" {...register('planId')} />

            {fetchingPlans ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-28 bg-white/5 border border-silver-muted/10 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="w-full flex justify-between">
                      <div className="w-8 h-3.5 bg-white/10 rounded" />
                      <div className="w-12 h-3.5 bg-white/10 rounded" />
                    </div>
                    <div className="w-16 h-6 bg-white/10 rounded my-1 self-center" />
                    <div className="w-12 h-4 bg-white/10 rounded self-center" />
                  </div>
                ))}
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-8 bg-white/5 border border-silver-muted/10 rounded-2xl text-sm text-silver-muted">
                {activePlans.length === 0 
                  ? 'No plans available for this network.' 
                  : 'No plans match the selected category.'}
              </div>
            ) : (
              <>
                {/* Category Filters */}
                {availableTypes.length > 2 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedType(type)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                          selectedType === type
                            ? 'bg-gradient-blue border border-primary-glow/30 text-white shadow-glow-blue'
                            : 'bg-white/5 border border-silver-muted/10 text-silver-muted hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {filteredPlans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handleCardClick(plan.id)}
                        className={`relative flex flex-col items-stretch justify-between p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-br from-primary-blue/20 to-primary-dark-blue/20 border-primary-glow shadow-glow-blue scale-[1.02]'
                            : 'bg-white/5 border-silver-muted/10 text-silver-muted hover:border-silver-muted/30 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {/* Top: Type & Validity */}
                        <div className="w-full flex justify-between items-center mb-2">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase ${getTypeBadgeStyles(plan.parsed.type)}`}>
                            {plan.parsed.type}
                          </span>
                          <span className="text-[10px] text-silver-muted/50 font-medium">
                            {plan.parsed.validity}
                          </span>
                        </div>

                        {/* Middle: Shortened Size */}
                        <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight my-1">
                          {plan.parsed.size}
                        </div>

                        {/* Bottom: Cost */}
                        <div className="text-xs sm:text-sm font-semibold text-primary-glow font-mono mt-1">
                          ₦{plan.sellingPrice.toLocaleString()}
                        </div>

                        {/* Selected Indicator Dot */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary-glow animate-pulse" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {errors.planId && (
              <p className="text-xs text-red-400 font-medium mt-1">{errors.planId.message}</p>
            )}
          </div>

          {/* Amount Display */}
          {selectedPlanId && (
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center text-sm font-semibold">
              <span className="text-silver-muted">Total Cost:</span>
              <span className="text-white font-mono text-base">₦{watch('amount')}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <span>Purchase Data</span>
            )}
          </button>
        </form>
      </div>
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onConfirm={handlePinConfirm}
        loading={loading}
      />

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-dark-bg-secondary border border-white/10 rounded-2xl glass-dark p-6 w-full max-w-sm shadow-2xl">
            {/* Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Purchase Successful!</h2>
              <p className="text-sm text-silver-muted mt-1">Your data has been sent</p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/5 mb-5">
              {[
                { label: 'Phone Number', value: receipt.phoneNumber },
                { label: 'Network', value: receipt.network.toUpperCase() },
                { label: 'Plan', value: receipt.planName },
                { label: 'Amount Paid', value: `₦${Number(receipt.amount).toLocaleString()}` },
                { label: 'Reference', value: receipt.reference, mono: true },
                { label: 'Status', value: '✅ Successful' },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-silver-muted">{label}</span>
                  <span className={`text-white font-semibold ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadReceiptPdf(receipt)}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={async () => {
                    const text = `AB Data Hub Receipt\n-------------------\nPhone: ${receipt.phoneNumber}\nNetwork: ${receipt.network.toUpperCase()}\nPlan: ${receipt.planName}\nAmount: ₦${Number(receipt.amount).toLocaleString()}\nReference: ${receipt.reference}\nStatus: Successful`
                    if (navigator.share) {
                      await navigator.share({ title: 'AB Data Hub Receipt', text })
                    } else {
                      await navigator.clipboard.writeText(text)
                      toast.success('Receipt copied to clipboard!')
                    }
                  }}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
              <button
                onClick={() => setReceipt(null)}
                className="w-full py-3 bg-gradient-blue text-white font-bold rounded-xl text-sm shadow-glow-blue hover:opacity-95 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Failure Receipt Modal */}
      {failedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-dark-bg-secondary border border-white/10 rounded-2xl glass-dark p-6 w-full max-w-sm shadow-2xl">
            {/* Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Purchase Failed</h2>
              <p className="text-sm text-red-400 mt-1 text-center px-2">{failedReceipt.errorMessage}</p>
            </div>

            {/* Details */}
            <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/5 mb-5">
              {[
                { label: 'Phone Number', value: failedReceipt.phoneNumber },
                { label: 'Network', value: failedReceipt.network },
                { label: 'Plan', value: failedReceipt.planName },
                { label: 'Amount', value: `₦${Number(failedReceipt.amount).toLocaleString()}` },
                { label: 'Status', value: '❌ Failed' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-silver-muted">{label}</span>
                  <span className="text-white font-semibold">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setFailedReceipt(null)}
              className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-300 font-bold rounded-xl text-sm hover:bg-red-500/30 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
