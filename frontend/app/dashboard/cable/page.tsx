'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import PinModal from '@/components/common/PinModal'

type ProviderType = 'dstv' | 'gotv' | 'startimes' | 'showmax'

export default function BuyCablePage() {
  const [provider, setProvider] = useState<ProviderType>('dstv')
  const [smartCardNo, setSmartCardNo] = useState('')
  const [selectedPackage, setSelectedPackage] = useState('')
  const [amount, setAmount] = useState(0)
  
  const [packages, setPackages] = useState<any[]>([])
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [feeConfig, setFeeConfig] = useState<any>(null)
  
  const [verifying, setVerifying] = useState(false)
  const [verifiedCustomer, setVerifiedCustomer] = useState<any>(null)

  const [loading, setLoading] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pendingData, setPendingData] = useState<any>(null)

  // Fetch dynamic service fee config on mount
  useEffect(() => {
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

  // Fetch dynamic packages when provider changes
  useEffect(() => {
    setLoadingPackages(true)
    setPackages([])
    setSelectedPackage('')
    setAmount(0)
    setVerifiedCustomer(null)

    api.get(`/services/cable/packages?service_id=${provider}`)
      .then((res) => {
        if (res.data?.success) {
          setPackages(res.data.data)
        }
      })
      .catch(() => {
        toast.error('Failed to load packages for ' + provider.toUpperCase())
      })
      .finally(() => {
        setLoadingPackages(false)
      })
  }, [provider])

  const handleProviderChange = (prov: ProviderType) => {
    setProvider(prov)
  }

  const handleSmartCardNoChange = (val: string) => {
    setSmartCardNo(val)
    setVerifiedCustomer(null)
  }

  const handlePackageChange = (pkgId: string) => {
    setSelectedPackage(pkgId)
    const selected = packages.find((pkg) => pkg.variation_id === pkgId)
    if (selected) {
      setAmount(parseFloat(selected.price) || 0)
    } else {
      setAmount(0)
    }
  }

  const handleVerify = async () => {
    if (!smartCardNo) {
      toast.error('Please enter decoder number')
      return
    }
    setVerifying(true)
    setVerifiedCustomer(null)
    try {
      const response = await api.post('/services/verify-customer', {
        customerId: smartCardNo,
        serviceId: provider,
      })
      
      const resData = response.data?.data
      if (resData && (resData.code === 'success' || resData.status === 'success' || resData.data?.status === 'success')) {
        const details = resData.data || resData
        setVerifiedCustomer(details)
        toast.success('Decoder verified successfully!')
      } else {
        toast.error(resData?.msg || resData?.message || 'Decoder verification failed.')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification request failed.')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!smartCardNo || !selectedPackage) {
      toast.error('Decoder Number and Package are required')
      return
    }

    if (!verifiedCustomer) {
      toast.error('Please verify your decoder number before proceeding')
      return
    }

    setPendingData({
      provider,
      smartCardNumber: smartCardNo,
      packageName: selectedPackage, // variation_id
      amount,
    })
    setPinModalOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    if (!pendingData) return
    setLoading(true)
    try {
      await api.post('/services/cable', {
        ...pendingData,
        pin,
      })
      toast.success('Cable TV renewed successfully!')
      setSmartCardNo('')
      setSelectedPackage('')
      setAmount(0)
      setVerifiedCustomer(null)
      setPinModalOpen(false)
      setPendingData(null)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Renewal failed. Check decoder number or balance.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate dynamic fee
  let calculatedFee = 0
  if (feeConfig && feeConfig.serviceFeeEnabled && amount > 0) {
    if (amount >= feeConfig.serviceFeeMinAmount && amount <= feeConfig.serviceFeeMaxAmount) {
      calculatedFee = feeConfig.serviceFeeAmount
    }
  }
  const totalCharge = amount + calculatedFee

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Cable TV Subscription</h1>
        <p className="text-sm text-silver-muted">
          Renew your decoder package dynamically using live API data
        </p>
      </div>

      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-6 rounded-2xl glass-dark glow-blue">
        {/* Provider selection tabs */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {(['dstv', 'gotv', 'startimes', 'showmax'] as ProviderType[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleProviderChange(p)}
              className={`py-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                provider === p
                  ? 'bg-gradient-blue border-primary-glow text-white shadow-glow-blue'
                  : 'bg-white/5 border-silver-muted/10 text-silver-muted hover:text-white'
              }`}
            >
              {p === 'startimes' ? 'StarTimes' : p === 'showmax' ? 'Showmax' : p.toUpperCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Decoder Smart Card Number & Verification */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Smart Card / Decoder Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={smartCardNo}
                onChange={(e) => handleSmartCardNoChange(e.target.value)}
                placeholder="e.g. 1023456789"
                className="flex-1 bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
              />
              <button
                type="button"
                disabled={verifying || !smartCardNo}
                onClick={handleVerify}
                className="px-5 bg-gradient-blue hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl transition-all disabled:opacity-40 flex items-center justify-center min-w-[100px]"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Verified Customer Information */}
          {verifiedCustomer && (
            <div className="p-4 bg-primary-glow/5 border border-primary-glow/20 rounded-xl text-left space-y-1">
              <p className="text-[10px] font-bold text-primary-glow uppercase tracking-wider">Verified Subscriber Details</p>
              <p className="text-sm font-bold text-white"><span className="text-silver-muted font-normal">Name:</span> {verifiedCustomer.customer_name || 'N/A'}</p>
            </div>
          )}

          {/* Package Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Select Package
            </label>
            <select
              value={selectedPackage}
              onChange={(e) => handlePackageChange(e.target.value)}
              disabled={loadingPackages || packages.length === 0}
              className="w-full bg-dark-bg-secondary border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
            >
              {loadingPackages ? (
                <option value="">Loading Packages...</option>
              ) : packages.length === 0 ? (
                <option value="">No Packages Available</option>
              ) : (
                <>
                  <option value="">-- Choose Decoder Package --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.variation_id} value={pkg.variation_id}>
                      {pkg.name} (₦{Number(pkg.price).toLocaleString()})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Pricing Breakdown */}
          {selectedPackage && amount > 0 && (
            <div className="p-3 bg-white/5 border border-silver-muted/10 rounded-xl text-xs space-y-1.5 font-mono text-silver-muted">
              <div className="flex justify-between">
                <span>Package Price:</span>
                <span className="text-white">₦{amount.toLocaleString()}</span>
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
            disabled={loading || !verifiedCustomer || !selectedPackage}
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
              <span>Renew Subscription</span>
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
