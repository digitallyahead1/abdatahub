'use client'

import Image from 'next/image'
import { Transaction } from '@/types'

interface TransactionReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
}

export default function TransactionReceiptModal({
  isOpen,
  onClose,
  transaction,
}: TransactionReceiptModalProps) {
  if (!isOpen || !transaction) return null

  const tx = transaction
  const isSuccess = tx.status === 'success'
  const isFailed = tx.status === 'failed'

  const meta = tx.metadata || {}
  const network = meta.network || meta.operator || meta.provider || meta.disco || null
  const recipient = meta.phoneNumber || meta.phone || meta.recipient || meta.meterNumber || meta.customerId || meta.smartCardNumber || null

  // Service label mapping
  const serviceLabels: Record<string, string> = {
    data: 'Data Subscription',
    airtime: 'Airtime Recharge',
    electricity: 'Electricity Bill',
    cable: 'Cable TV Subscription',
    'exam-pin': 'Exam Pin Purchase',
    deposit: 'Wallet Deposit',
    reversal: 'Transaction Reversal',
    referral: 'Referral Commission',
  }
  const serviceLabel = serviceLabels[tx.service] || tx.service

  // Format date
  const formattedDate = new Date(tx.createdAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Build key-value dynamic details for all services
  const detailsList: { label: string; value: string; isMono?: boolean }[] = []

  // Service Type is always the first row
  detailsList.push({ label: 'Service Type', value: serviceLabel })

  if (tx.service === 'data') {
    if (network) detailsList.push({ label: 'Network Provider', value: network.toUpperCase() })
    if (meta.planName || meta.plan) detailsList.push({ label: 'Data Plan', value: meta.planName || meta.plan })
    if (recipient) detailsList.push({ label: 'Recipient Phone', value: recipient, isMono: true })
  } else if (tx.service === 'airtime') {
    if (network) detailsList.push({ label: 'Network Provider', value: network.toUpperCase() })
    if (meta.faceValue) detailsList.push({ label: 'Airtime Value', value: `₦${meta.faceValue.toLocaleString()}` })
    if (recipient) detailsList.push({ label: 'Recipient Phone', value: recipient, isMono: true })
  } else if (tx.service === 'electricity') {
    if (meta.disco) detailsList.push({ label: 'DisCo Provider', value: meta.disco.toUpperCase() })
    if (meta.meterType) detailsList.push({ label: 'Meter Type', value: meta.meterType.toUpperCase() })
    if (recipient) detailsList.push({ label: 'Meter Number', value: recipient, isMono: true })
    
    const customerName = meta.customerName || meta.customer_name || null
    if (customerName) detailsList.push({ label: 'Customer Name', value: customerName })
    
    const customerAddress = meta.customerAddress || meta.customer_address || meta.address || null
    if (customerAddress) detailsList.push({ label: 'Customer Address', value: customerAddress })
    
    const units = meta.units || meta.unitsPurchased || null
    if (units) detailsList.push({ label: 'Units Purchased', value: String(units) })
    
    const token = meta.token || meta.tokenKey || meta.token_key || null
    if (token) detailsList.push({ label: 'Token Key', value: token, isMono: true })
  } else if (tx.service === 'cable') {
    if (meta.provider) detailsList.push({ label: 'Cable Provider', value: meta.provider.toUpperCase() })
    if (meta.packageName) detailsList.push({ label: 'Bouquet Package', value: meta.packageName })
    if (recipient) detailsList.push({ label: 'Smart Card No.', value: recipient, isMono: true })
    
    const customerName = meta.customerName || meta.customer_name || null
    if (customerName) detailsList.push({ label: 'Customer Name', value: customerName })
  } else if (tx.service === 'exam-pin') {
    if (meta.examType) detailsList.push({ label: 'Exam Board', value: meta.examType.toUpperCase() })
    if (meta.quantity) detailsList.push({ label: 'Quantity Purchased', value: String(meta.quantity) })
    if (meta.pins && Array.isArray(meta.pins)) {
      meta.pins.forEach((p: any, idx: number) => {
        detailsList.push({
          label: `PIN Code ${idx + 1}`,
          value: `${p.pinCode}${p.serialNumber ? ` (S/N: ${p.serialNumber})` : ''}`,
          isMono: true,
        })
      })
    }
  } else if (tx.service === 'deposit') {
    if (meta.paymentMethod) detailsList.push({ label: 'Payment Method', value: meta.paymentMethod })
  } else if (tx.service === 'reversal') {
    if (meta.reason) detailsList.push({ label: 'Reversal Reason', value: meta.reason })
    if (meta.originalReference) detailsList.push({ label: 'Original Reference', value: meta.originalReference, isMono: true })
  }

  const handlePrint = () => {
    window.print()
  }

  // Brand Color configured headers (uses AB Data Hub premium blue theme)
  const statusConfig = isSuccess
    ? { bg: 'bg-gradient-to-br from-[#0066E8] to-[#00A8FF]', iconColor: 'text-[#0066E8]', title: 'Transaction Successful', color: 'text-emerald-500' }
    : isFailed
    ? { bg: 'bg-gradient-to-br from-red-600 to-red-800', iconColor: 'text-red-600', title: 'Transaction Failed', color: 'text-red-500' }
    : { bg: 'bg-gradient-to-br from-amber-500 to-orange-600', iconColor: 'text-amber-500', title: 'Transaction Pending', color: 'text-amber-500' }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 animate-fade-in print:bg-white print:backdrop-blur-none print:static print:px-0">
      <div
        id="transaction-receipt"
        className="relative bg-white rounded-xl max-w-sm w-full shadow-2xl overflow-y-auto max-h-[92vh] print:shadow-none print:max-w-full print:rounded-none print:max-h-none"
      >
        {/* Close button (hidden on print) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/80 hover:text-white transition-all focus:outline-none print:hidden"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Status Header (Styled with Brand Color) */}
        <div className={`${statusConfig.bg} px-5 pt-5 pb-6 text-center text-white relative overflow-hidden`}>
          {/* Decorative design circles */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative z-10 space-y-1.5">
            {/* White status circle icon */}
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center mx-auto shadow-md">
              {isSuccess ? (
                <svg className={`w-6 h-6 ${statusConfig.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : isFailed ? (
                <svg className={`w-6 h-6 ${statusConfig.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className={`w-6 h-6 ${statusConfig.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <div>
              <h3 className="text-base font-extrabold tracking-wide">{statusConfig.title}</h3>
              <p className="text-white/80 text-xs">Receipt for Transaction</p>
            </div>
          </div>
        </div>

        {/* Brand logo + name */}
        <div className="flex items-center justify-center gap-2 pt-3 pb-1">
          <div className="relative w-6 h-6 rounded-md overflow-hidden border border-gray-200 shadow-sm">
            <Image src="/logo.png" alt="AB Data Hub" fill className="object-cover" />
          </div>
          <span className="text-sm font-extrabold tracking-wide bg-gradient-to-r from-[#0066E8] to-[#00A8FF] bg-clip-text text-transparent">
            AB Data Hub
          </span>
        </div>

        {/* Receipt details rows */}
        <div className="px-5 pb-1 space-y-0 divide-y divide-gray-100">
          {detailsList.map((row, idx) => (
            <div key={idx} className="flex justify-between items-start py-2.5">
              <span className="text-gray-500 text-xs font-semibold pr-2">{row.label}</span>
              <span className={`text-gray-900 font-bold text-xs text-right ${row.isMono ? 'font-mono text-[10px] select-all break-all max-w-[65%]' : ''}`}>
                {row.value}
              </span>
            </div>
          ))}

          <div className="flex justify-between items-center py-2.5">
            <span className="text-gray-500 text-xs font-semibold">Amount</span>
            <span className="text-gray-900 font-extrabold text-sm">₦{tx.amount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-start py-2.5">
            <span className="text-gray-500 text-xs font-semibold">Reference</span>
            <span className="text-gray-900 font-bold text-[10px] font-mono text-right max-w-[60%] break-all select-all">{tx.reference}</span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-gray-500 text-xs font-semibold">Status</span>
            <span className={`font-bold text-xs ${statusConfig.color}`}>
              {isSuccess ? 'Successful' : isFailed ? 'Failed' : 'Pending'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <span className="text-gray-500 text-xs font-semibold">Date</span>
            <span className="text-gray-900 font-medium text-xs">{formattedDate}</span>
          </div>
        </div>

        {/* Action buttons (hidden on print) */}
        <div className="px-5 pb-5 pt-3 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all text-xs"
          >
            Done
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-white border border-[#0066E8] text-[#0066E8] hover:bg-blue-50 font-bold rounded-lg transition-all text-xs flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Save/Print</span>
          </button>
        </div>
      </div>
    </div>
  );
}
