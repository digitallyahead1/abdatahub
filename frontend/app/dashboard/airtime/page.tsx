'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { airtimeTransactionSchema, AirtimeTransactionInput } from '@/lib/validators'
import api from '@/lib/api'
import { toast } from 'sonner'
import PinModal from '@/components/common/PinModal'

type NetworkType = 'mtn' | 'airtel' | 'glo' | '9mobile'

interface AirtimePricing {
  network: string
  sellingRate: number
}

export default function BuyAirtimePage() {
  const [activeNetwork, setActiveNetwork] = useState<NetworkType>('mtn')
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<AirtimePricing[]>([])
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pendingData, setPendingData] = useState<AirtimeTransactionInput | null>(null)

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await api.get('/services/airtime/pricing')
        setRates(response.data.data)
      } catch (err) {
        console.error('Failed to load airtime rates:', err)
      }
    }
    fetchRates()
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AirtimeTransactionInput>({
    resolver: zodResolver(airtimeTransactionSchema),
    defaultValues: {
      network: 'mtn',
    },
  })

  const amountVal = watch('amount')

  const activePricing = rates.find((r) => r.network === activeNetwork)
  const sellingRate = activePricing ? Number(activePricing.sellingRate) : 1.0

  const handleNetworkChange = (net: NetworkType) => {
    setActiveNetwork(net)
    setValue('network', net)
  }

  const onSubmit = async (data: AirtimeTransactionInput) => {
    setPendingData(data)
    setPinModalOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    if (!pendingData) return
    setLoading(true)
    try {
      const response = await api.post('/services/airtime', {
        ...pendingData,
        pin,
      })
      toast.success(response.data.message || 'Airtime purchase completed successfully!')
      setValue('amount', 0 as any)
      setPinModalOpen(false)
      setPendingData(null)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transaction failed. Please check your wallet balance.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Purchase Airtime</h1>
        <p className="text-sm text-silver-muted">
          Recharge your phone network instantly
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

          {/* Amount */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Amount (₦)
            </label>
            <input
              type="number"
              {...register('amount', { valueAsNumber: true })}
              placeholder="Minimum 10"
              className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
            />
            {errors.amount && (
              <p className="text-xs text-red-400 font-medium">{errors.amount.message}</p>
            )}
          </div>

          {/* Real-time Pricing Summary */}
          {amountVal > 0 && (
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 text-sm font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-silver-muted">Selling Rate:</span>
                <span className="text-white font-mono">{(sellingRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center text-base border-t border-white/5 pt-2">
                <span className="text-silver-muted">You Pay:</span>
                <span className="text-white font-mono">₦{(amountVal * sellingRate).toFixed(2)}</span>
              </div>
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
              <span>Purchase Airtime</span>
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
    </div>
  )
}
