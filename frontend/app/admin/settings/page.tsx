'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Pricing configuration
  const [mtnMargin, setMtnMargin] = useState('0')
  const [airtelMargin, setAirtelMargin] = useState('0')
  const [utilityFee, setUtilityFee] = useState('0')
  
  // Service Fee Config
  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(true)
  const [serviceFeeMinAmount, setServiceFeeMinAmount] = useState('1000')
  const [serviceFeeMaxAmount, setServiceFeeMaxAmount] = useState('20000')
  const [serviceFeeAmount, setServiceFeeAmount] = useState('30')
  
  // API provider toggles
  const [activeGateway, setActiveGateway] = useState('simulated')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await api.get('/admin/settings')
        const settings = response.data.data
        setMtnMargin(settings.mtnMargin.toString())
        setAirtelMargin(settings.airtelMargin.toString())
        setUtilityFee(settings.utilityFee.toString())
        setActiveGateway(settings.activeGateway)
        setServiceFeeEnabled(settings.serviceFeeEnabled ?? true)
        setServiceFeeMinAmount((settings.serviceFeeMinAmount ?? 1000).toString())
        setServiceFeeMaxAmount((settings.serviceFeeMaxAmount ?? 20000).toString())
        setServiceFeeAmount((settings.serviceFeeAmount ?? 30).toString())
      } catch (err) {
        console.error('Error fetching system configs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/admin/settings', {
        mtnMargin: parseFloat(mtnMargin),
        airtelMargin: parseFloat(airtelMargin),
        utilityFee: parseFloat(utilityFee),
        activeGateway,
        serviceFeeEnabled,
        serviceFeeMinAmount: parseFloat(serviceFeeMinAmount),
        serviceFeeMaxAmount: parseFloat(serviceFeeMaxAmount),
        serviceFeeAmount: parseFloat(serviceFeeAmount),
      })
      toast.success('System configurations updated successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary-glow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">System & API Settings</h1>
        <p className="text-sm text-silver-muted">
          Adjust profit margins, transaction fees, service fees, and default API gateway settings
        </p>
      </div>

      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-6 rounded-2xl glass-dark glow-blue">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Pricing Adjustments */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Profit Margins & Fees</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  MTN Data Profit Margin (₦/GB)
                </label>
                <input
                  type="number"
                  value={mtnMargin}
                  onChange={(e) => setMtnMargin(e.target.value)}
                  className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  Airtel Data Profit Margin (₦/GB)
                </label>
                <input
                  type="number"
                  value={airtelMargin}
                  onChange={(e) => setAirtelMargin(e.target.value)}
                  className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                Utility Payment Processing Fee (₦/Transaction)
              </label>
              <input
                type="number"
                value={utilityFee}
                onChange={(e) => setUtilityFee(e.target.value)}
                className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
              />
            </div>
          </div>

          {/* Service Fee Config */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              Utility Service Fee Configuration (Electricity & Cable TV)
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-white/5 border border-silver-muted/10 rounded-xl">
              <div>
                <span className="text-sm font-bold text-white block">Enable Service Fee</span>
                <span className="text-xs text-silver-muted">Apply service fee to electricity & cable purchases</span>
              </div>
              <button
                type="button"
                onClick={() => setServiceFeeEnabled(!serviceFeeEnabled)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  serviceFeeEnabled
                    ? 'bg-gradient-blue border-primary-glow text-white shadow-glow-blue'
                    : 'bg-white/5 border-silver-muted/10 text-silver-muted'
                }`}
              >
                {serviceFeeEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {serviceFeeEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                    Min Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={serviceFeeMinAmount}
                    onChange={(e) => setServiceFeeMinAmount(e.target.value)}
                    className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                    Max Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={serviceFeeMaxAmount}
                    onChange={(e) => setServiceFeeMaxAmount(e.target.value)}
                    className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                    Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={serviceFeeAmount}
                    onChange={(e) => setServiceFeeAmount(e.target.value)}
                    className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Active API Gateway */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Active API Provider Gateway</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'simulated', title: 'Simulated Sandbox', desc: 'Mock response gateway' },
                { id: 'paystack', title: 'Paystack Production', desc: 'Real payment API' },
                { id: 'flutterwave', title: 'Flutterwave Production', desc: 'Secondary active link' },
              ].map((gate) => (
                <button
                  key={gate.id}
                  type="button"
                  onClick={() => setActiveGateway(gate.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col space-y-1 transition-all ${
                    activeGateway === gate.id
                      ? 'bg-gradient-blue border-primary-glow text-white shadow-glow-blue'
                      : 'bg-white/5 border-silver-muted/10 text-silver-muted hover:text-white'
                  }`}
                >
                  <span className="text-sm font-bold">{gate.title}</span>
                  <span className="text-[10px] opacity-80">{gate.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            {saving ? 'Saving Configurations...' : 'Save Configuration Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
