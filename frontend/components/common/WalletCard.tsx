'use client'

export function WalletCard() {
  return (
    <div className="card-gradient p-6 rounded-lg border border-silver-muted/10">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-silver-muted mb-2">Wallet Balance</p>
          <h3 className="text-3xl font-bold text-silver-light">₦5,000</h3>
          <p className="text-xs text-silver-muted mt-2">Available balance</p>
        </div>
        <div className="w-12 h-12 bg-primary-blue/20 rounded-lg flex items-center justify-center">
          <span className="text-2xl">💳</span>
        </div>
      </div>
      <button className="mt-6 w-full btn-primary text-sm">Fund Wallet</button>
    </div>
  )
}
