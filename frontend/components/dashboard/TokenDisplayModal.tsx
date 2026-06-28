'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface TokenDisplayModalProps {
  isOpen: boolean
  onClose: () => void
  token: string
  units?: string
  band?: string
  customerName?: string
  amount?: number
  meterNumber?: string
  disco?: string
}

export default function TokenDisplayModal({
  isOpen,
  onClose,
  token,
  units,
  band,
  customerName,
  amount,
  meterNumber,
  disco,
}: TokenDisplayModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    toast.success('Electricity token copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 animate-fade-in">
      <div className="relative bg-dark-bg-secondary border border-silver-muted/10 p-6 rounded-2xl max-w-md w-full glass-dark glow-blue shadow-2xl text-center space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-silver-muted hover:text-white transition-all focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-2">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl">
            ⚡
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">Prepaid Electricity Token</h3>
          <p className="text-xs text-silver-muted">
            Use the token below to load units on your prepaid meter
          </p>
        </div>

        {/* Token Box */}
        <div className="bg-dark-bg/60 border border-white/5 p-4 rounded-xl space-y-3 relative overflow-hidden">
          <p className="text-2xl font-mono font-extrabold text-white tracking-widest select-all">
            {token}
          </p>
          <button
            onClick={handleCopy}
            className="w-full py-2 bg-gradient-blue text-white text-xs font-bold uppercase rounded-lg hover:opacity-95 transition-all shadow-glow-blue flex items-center justify-center space-x-1.5"
          >
            <span>{copied ? 'Copied! ✓' : 'Copy Token'}</span>
          </button>
        </div>

        {/* Details List */}
        <div className="border-t border-white/5 pt-4 text-left space-y-2 text-xs">
          {customerName && (
            <div className="flex justify-between">
              <span className="text-silver-muted">Customer Name:</span>
              <span className="text-white font-semibold">{customerName}</span>
            </div>
          )}
          {meterNumber && (
            <div className="flex justify-between">
              <span className="text-silver-muted">Meter Number:</span>
              <span className="text-white font-mono font-semibold">{meterNumber}</span>
            </div>
          )}
          {disco && (
            <div className="flex justify-between">
              <span className="text-silver-muted">Distribution Co (DisCo):</span>
              <span className="text-white capitalize font-semibold">{disco.replace('-', ' ')}</span>
            </div>
          )}
          {amount !== undefined && amount > 0 && (
            <div className="flex justify-between">
              <span className="text-silver-muted">Amount Paid:</span>
              <span className="text-white font-semibold font-mono">₦{amount.toLocaleString()}</span>
            </div>
          )}
          {units && (
            <div className="flex justify-between">
              <span className="text-silver-muted">Token Units:</span>
              <span className="text-emerald-400 font-bold font-mono">{units}</span>
            </div>
          )}
          {band && (
            <div className="flex justify-between">
              <span className="text-silver-muted">Meter Band:</span>
              <span className="text-emerald-400 font-bold uppercase font-mono">{band}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-white/5 hover:bg-white/10 text-silver-light hover:text-white font-semibold rounded-xl transition-all border border-silver-muted/10 text-xs uppercase tracking-wider"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
