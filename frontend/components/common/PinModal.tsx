'use client'

import { useRef, useState, useEffect } from 'react'

interface PinModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (pin: string) => void
  title?: string
  description?: string
  loading?: boolean
}

export default function PinModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Enter Transaction PIN',
  description = 'Provide your 4-digit transaction PIN to complete this action.',
  loading = false,
}: PinModalProps) {
  const [pin, setPin] = useState<string[]>(['', '', '', ''])
  const [showPin, setShowPin] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Focus the first box on opening
  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', ''])
      setTimeout(() => inputRefs[0].current?.focus(), 100)
    }
  }, [isOpen])

  // Automatically submit once all 4 digits are entered
  useEffect(() => {
    const fullPin = pin.join('')
    if (fullPin.length === 4 && isOpen && !loading) {
      onConfirm(fullPin)
    }
  }, [pin, isOpen, loading, onConfirm])

  if (!isOpen) return null

  const handleChange = (val: string, index: number) => {
    // Only accept numeric inputs
    if (val !== '' && !/^[0-9]$/.test(val)) return

    const newPin = [...pin]
    newPin[index] = val
    setPin(newPin)

    // Automatically shift focus to next block if filled
    if (val !== '' && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (pin[index] === '' && index > 0) {
        // Shift focus to previous block and delete
        const newPin = [...pin]
        newPin[index - 1] = ''
        setPin(newPin)
        inputRefs[index - 1].current?.focus()
      } else {
        const newPin = [...pin]
        newPin[index] = ''
        setPin(newPin)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 4)
    if (!/^\d+$/.test(pastedData)) return

    const newPin = [...pin]
    pastedData.split('').forEach((char, idx) => {
      if (idx < 4) {
        newPin[idx] = char
      }
    })
    setPin(newPin)
    
    // Focus the last input or next unfilled
    const nextFocusIdx = Math.min(pastedData.length, 3)
    inputRefs[nextFocusIdx].current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullPin = pin.join('')
    if (fullPin.length === 4) {
      onConfirm(fullPin)
    }
  }

  const isComplete = pin.join('').length === 4

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="relative bg-dark-bg-secondary border border-silver-muted/10 p-6 rounded-2xl max-w-sm w-full glass-dark glow-blue shadow-2xl animate-fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-silver-muted hover:text-white transition-all focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
            <p className="text-xs text-silver-muted leading-relaxed">
              {description}
            </p>
          </div>

          {/* PIN Digit Inputs */}
          <div className="flex justify-center items-center space-x-3">
            {pin.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type={showPin ? 'text' : 'password'}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-12 h-14 bg-dark-bg/60 border border-silver-muted/15 focus:border-primary-glow/60 rounded-xl text-center text-xl font-bold text-white focus:outline-none transition-all font-mono"
              />
            ))}
          </div>

          {/* Toggle PIN display */}
          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-silver-muted hover:text-white transition-colors"
            >
              {showPin ? 'Hide PIN' : 'Show PIN'}
            </button>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-3 bg-white/5 hover:bg-white/10 text-silver-light hover:text-white font-semibold rounded-xl transition-all border border-silver-muted/10 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isComplete || loading}
              className="py-3 bg-gradient-blue text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Confirm</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
