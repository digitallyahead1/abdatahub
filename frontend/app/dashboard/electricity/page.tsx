'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import PinModal from '@/components/common/PinModal'
import TokenDisplayModal from '@/components/dashboard/TokenDisplayModal'

export default function BuyElectricityPage() {
  const [loading, setLoading] = useState(false)
  const [discos, setDiscos] = useState<{ id: string; name: string }[]>([])
  const [feeConfig, setFeeConfig] = useState<any>(null)
  
  const [disco, setDisco] = useState('')
  const [meterNo, setMeterNo] = useState('')
  const [meterType, setMeterType] = useState('prepaid')
  const [amount, setAmount] = useState('')
  
  const [verifying, setVerifying] = useState(false)
  const [verifiedCustomer, setVerifiedCustomer] = useState<any>(null)
  
  const [token, setToken] = useState<string | null>(null)
  const [units, setUnits] = useState<string | null>(null)
  const [band, setBand] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)

  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pendingData, setPendingData] = useState<any>(null)
  const [tokenModalOpen, setTokenModalOpen] = useState(false)

  useEffect(() => {
    // Fetch dynamic discos
    api.get('/services/electricity/discos')
      .then((res) => {
        if (res.data?.success) {
          setDiscos(res.data.data)
        }
      })
      .catch(() => {
        toast.error('Failed to load electricity providers')
      })

    // Fetch dynamic service fee config
    api.get('/services/settings')
      .then((res) => {
        if (res.data?.success) {
          setFeeConfig(res.data.data)
        }
      })
      .catch((err) => {
        console.error('Failed to load fee configuration', err)
      })
  }, [])

  // Clear verification status if input fields change
  const handleDiscoChange = (val: string) => {
    setDisco(val)
    setVerifiedCustomer(null)
  }

  const handleMeterNoChange = (val: string) => {
    setMeterNo(val)
    setVerifiedCustomer(null)
  }

  const handleMeterTypeChange = (val: string) => {
    setMeterType(val)
    setVerifiedCustomer(null)
  }

  const handleVerify = async () => {
    if (!disco) {
      toast.error('Please select a DisCo first')
      return
    }
    if (!meterNo) {
      toast.error('Please enter a meter number')
      return
    }
    setVerifying(true)
    setVerifiedCustomer(null)

    const checkOffline = (msgStr: string) => {
      const msg = msgStr.toLowerCase()
      return msg.includes('timeout') || msg.includes('504') || msg.includes('502') || msg.includes('503') || msg.includes('upstream') || msg.includes('gateway')
    }

    try {
      const response = await api.post('/services/verify-customer', {
        customerId: meterNo,
        serviceId: disco,
        variationId: meterType,
      })
      
      const resData = response.data?.data
      if (resData && (resData.code === 'success' || resData.status === 'success' || resData.data?.status === 'success')) {
        const details = resData.data || resData
        setVerifiedCustomer(details)
        toast.success('Meter number verified successfully!')
      } else {
        const errorMsg = resData?.msg || resData?.message || ''
        if (checkOffline(errorMsg)) {
          setVerifiedCustomer({
            customer_name: 'Proceed without verification (Service Offline)',
            isOffline: true,
          })
          toast.warning('Verification service is offline. You can proceed with caution.')
        } else {
          toast.error(errorMsg || 'Meter verification failed. Check details.')
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.data?.msg || err.response?.data?.data?.message || err.message || ''
      if (checkOffline(errorMsg)) {
        setVerifiedCustomer({
          customer_name: 'Proceed without verification (Service Offline)',
          isOffline: true,
        })
        toast.warning('Verification service is offline. You can proceed with caution.')
      } else {
        toast.error(errorMsg || 'Verification request failed.')
      }
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disco || !meterNo || !amount) {
      toast.error('All fields are required')
      return
    }

    if (!verifiedCustomer) {
      toast.error('Please verify the meter number before proceeding')
      return
    }

    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 500) {
      toast.error('Minimum purchase amount is ₦500')
      return
    }

    setPendingData({
      disco,
      meterNumber: meterNo,
      meterType,
      amount: amt,
    })
    setPinModalOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    if (!pendingData) return
    setLoading(true)
    setToken(null)
    setUnits(null)
    setBand(null)
    setCustomerName(null)
    try {
      const response = await api.post('/services/electricity', {
        ...pendingData,
        pin,
      })
      toast.success('Bill paid successfully!')
      const resData = response.data?.data
      if (resData?.token) {
        setToken(resData.token)
        setUnits(resData.units)
        setBand(resData.band)
        setCustomerName(resData.customerName)
        setTokenModalOpen(true)
      }
      setPinModalOpen(false)
      setVerifiedCustomer(null) // reset after successful purchase
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed. Check meter status and balance.')
      setPendingData(null)
    } finally {
      setLoading(false)
    }
  }

  // Calculate dynamic fee
  const amtVal = parseFloat(amount)
  let calculatedFee = 0
  if (feeConfig && feeConfig.serviceFeeEnabled && !isNaN(amtVal)) {
    if (amtVal >= feeConfig.serviceFeeMinAmount && amtVal <= feeConfig.serviceFeeMaxAmount) {
      calculatedFee = feeConfig.serviceFeeAmount
    }
  }
  const totalCharge = !isNaN(amtVal) ? amtVal + calculatedFee : 0

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Electricity Bills</h1>
        <p className="text-sm text-silver-muted">
          Pay your electricity bill and generate prepaid tokens instantly via dynamic API
        </p>
      </div>

      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-6 rounded-2xl glass-dark glow-blue">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* DisCo Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Select Distribution Company (DisCo)
            </label>
            <select
              value={disco}
              onChange={(e) => handleDiscoChange(e.target.value)}
              className="w-full bg-dark-bg-secondary border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
            >
              <option value="">-- Choose DisCo --</option>
              {discos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Meter Type */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Meter Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleMeterTypeChange('prepaid')}
                className={`py-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                  meterType === 'prepaid'
                    ? 'bg-gradient-blue border-primary-glow text-white shadow-glow-blue'
                    : 'bg-white/5 border-silver-muted/10 text-silver-muted hover:text-white'
                }`}
              >
                Prepaid
              </button>
              <button
                type="button"
                onClick={() => handleMeterTypeChange('postpaid')}
                className={`py-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                  meterType === 'postpaid'
                    ? 'bg-gradient-blue border-primary-glow text-white shadow-glow-blue'
                    : 'bg-white/5 border-silver-muted/10 text-silver-muted hover:text-white'
                }`}
              >
                Postpaid
              </button>
            </div>
          </div>

          {/* Meter Number & Verification */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Meter Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={meterNo}
                onChange={(e) => handleMeterNoChange(e.target.value)}
                placeholder="e.g. 04230001234"
                className="flex-1 bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
              />
              <button
                type="button"
                disabled={verifying || !disco || !meterNo}
                onClick={handleVerify}
                className="px-5 bg-gradient-blue hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl transition-all disabled:opacity-40 flex items-center justify-center min-w-[100px]"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Verified Customer Information */}
          {verifiedCustomer && (
            verifiedCustomer.isOffline ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left space-y-1">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">⚠️ Verification Service Offline</p>
                <p className="text-sm font-bold text-white">Could not verify meter details because the provider's service is offline.</p>
                <p className="text-xs text-silver-muted">You can proceed, but please double-check your meter number to avoid loss of funds.</p>
              </div>
            ) : (
              <div className="p-4 bg-primary-glow/5 border border-primary-glow/20 rounded-xl text-left space-y-1 animate-pulse">
                <p className="text-[10px] font-bold text-primary-glow uppercase tracking-wider">Verified Subscriber Details</p>
                <p className="text-sm font-bold text-white"><span className="text-silver-muted font-normal">Name:</span> {verifiedCustomer.customer_name || 'N/A'}</p>
                {verifiedCustomer.customer_address && (
                  <p className="text-xs text-silver-muted"><span className="font-normal text-silver-muted">Address:</span> {verifiedCustomer.customer_address}</p>
                )}
              </div>
            )
          )}

          {/* Amount */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Amount (₦)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Minimum 500"
              className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
            />
          </div>

          {/* Pricing Breakdown */}
          {!isNaN(amtVal) && amtVal > 0 && (
            <div className="p-3 bg-white/5 border border-silver-muted/10 rounded-xl text-xs space-y-1.5 font-mono text-silver-muted">
              <div className="flex justify-between">
                <span>Base Amount:</span>
                <span className="text-white">₦{amtVal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee:</span>
                <span className="text-white">₦{calculatedFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-silver-muted/10 my-1 pt-1 flex justify-between font-bold text-white">
                <span>Total Charge:</span>
                <span className="text-primary-glow">₦{totalCharge.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !verifiedCustomer}
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
              <span>Pay Electricity Bill</span>
            )}
          </button>
        </form>

        {/* Generated Token display */}
        {token && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Purchase Successful!</p>
            {customerName && <p className="text-xs text-white">Subscriber: {customerName}</p>}
            <p className="text-2xl font-bold text-white tracking-widest font-mono select-all bg-dark-bg/60 py-2.5 rounded-lg border border-white/5">
              {token}
            </p>
            {units && <p className="text-xs text-silver-muted">Units: <span className="text-emerald-400 font-bold">{units}</span> {band && <>| Band: <span className="text-emerald-400 font-bold">{band}</span></>}</p>}
            <p className="text-[10px] text-silver-muted/80">Copy and enter this token on your prepaid keypad.</p>
          </div>
        )}
      </div>
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false)
          setPendingData(null)
        }}
        onConfirm={handlePinConfirm}
        loading={loading}
      />
      <TokenDisplayModal
        isOpen={tokenModalOpen}
        onClose={() => {
          setTokenModalOpen(false)
          setPendingData(null)
        }}
        token={token || ''}
        units={units || undefined}
        band={band || undefined}
        customerName={customerName || undefined}
        amount={pendingData ? Number(pendingData.amount) : undefined}
        meterNumber={pendingData ? pendingData.meterNumber : undefined}
        disco={disco}
      />
    </div>
  )
}
