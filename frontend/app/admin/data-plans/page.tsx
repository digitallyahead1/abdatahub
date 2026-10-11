'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface DataPlan {
  id: string
  smeplugPlanId: number
  network: string
  bundleName: string
  smeplugCost: number
  sellingPrice: number
  agentPrice: number
  overrideStatus: boolean
  visibilityStatus: boolean
  lastSyncedAt: string
  provider?: string
}

interface DeletedDataPlan {
  id: string
  smeplugPlanId: number
  provider: string
  network: string
  bundleName: string
  costPrice: number
  deletedBy: string
  deletedAt: string
}

type TabType = 'mtn' | 'airtel' | 'glo' | '9mobile' | 'swiftbills' | 'danmalama'
type ViewMode = 'active' | 'deleted'

// ─── Permanent Delete Confirmation Modal ──────────────────────────────────────
function DeleteConfirmModal({
  plan,
  onConfirm,
  onCancel,
  loading,
}: {
  plan: DataPlan
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0f1117] border border-red-500/30 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-5">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h2 className="text-center text-lg font-bold text-white mb-1">Permanently Delete Plan</h2>
        <p className="text-center text-sm text-gray-400 mb-5">
          This action cannot be undone. The plan will be removed from all providers and will never be re-created during sync.
        </p>

        {/* Plan Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Bundle Name</span>
            <span className="text-white font-semibold">{plan.bundleName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Plan ID</span>
            <span className="text-white font-mono">{plan.smeplugPlanId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Network</span>
            <span className="text-white uppercase">{plan.network}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Provider</span>
            <span className="text-white capitalize">{plan.provider || 'smeplug'}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
            <span className="text-gray-500">Cost Price</span>
            <span className="text-white font-mono">₦{plan.smeplugCost?.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Deleting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Yes, Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bulk Delete Confirmation Modal ───────────────────────────────────────────
function BulkDeleteModal({
  count,
  onConfirm,
  onCancel,
  loading,
}: {
  count: number
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-[#0f1117] border border-red-500/30 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-5">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h2 className="text-center text-lg font-bold text-white mb-1">Delete {count} Plan{count !== 1 ? 's' : ''}?</h2>
        <p className="text-center text-sm text-gray-400 mb-6">
          All selected plans will be permanently removed across all providers. This action cannot be undone and the plans will not be re-added on sync.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Deleting…</>
            ) : (
              <>Delete {count} Plan{count !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Restore Confirmation Modal ───────────────────────────────────────────────
function RestoreModal({
  plan,
  onConfirm,
  onCancel,
  loading,
}: {
  plan: DeletedDataPlan
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-[#0f1117] border border-emerald-500/30 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto mb-5">
          <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-center text-lg font-bold text-white mb-1">Restore Plan</h2>
        <p className="text-center text-sm text-gray-400 mb-5">
          This will restore <span className="text-white font-semibold">"{plan.bundleName}"</span> back to the active plans table. It will be available during the next sync cycle.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Restoring…</>
            ) : (
              <>Restore Plan</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDataPlansPage() {
  const [plans, setPlans] = useState<DataPlan[]>([])
  const [deletedPlans, setDeletedPlans] = useState<DeletedDataPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('mtn')
  const [viewMode, setViewMode] = useState<ViewMode>('active')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<string>('')
  const [editingAgentPrice, setEditingAgentPrice] = useState<string>('')
  const [editingBundleName, setEditingBundleName] = useState<string>('')
  const [editingSmeplugPlanId, setEditingSmeplugPlanId] = useState<string>('')

  // Delete modal state
  const [planToDelete, setPlanToDelete] = useState<DataPlan | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Bulk select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

  // Restore modal state
  const [planToRestore, setPlanToRestore] = useState<DeletedDataPlan | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const [activeRes, deletedRes] = await Promise.all([
        api.get('/admin/data-plans'),
        api.get('/admin/data-plans/deleted'),
      ])
      setPlans(activeRes.data.data)
      setDeletedPlans(deletedRes.data.data)
    } catch (err) {
      console.error('Failed to fetch data plans:', err)
      toast.error('Could not fetch data plans from server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Clear selection when tab/view changes
  useEffect(() => {
    setSelectedIds(new Set())
    setEditingId(null)
  }, [activeTab, viewMode])

  const handleSync = async () => {
    try {
      setSyncing(true)
      const endpoint = activeTab === 'danmalama' ? '/admin/danmalama/sync' : '/admin/smeplug/sync'
      const res = await api.post(endpoint)
      toast.success(res.data.message || 'Synchronization complete!')
      await fetchPlans()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  const toggleOverride = async (plan: DataPlan) => {
    try {
      const updated = await api.put(`/admin/data-plans/${plan.id}`, {
        overrideStatus: !plan.overrideStatus,
      })
      toast.success('Price override status updated.')
      setPlans(plans.map((p) => (p.id === plan.id ? updated.data.data : p)))
    } catch {
      toast.error('Failed to update override status.')
    }
  }

  const toggleVisibility = async (plan: DataPlan) => {
    try {
      const updated = await api.put(`/admin/data-plans/${plan.id}`, {
        visibilityStatus: !plan.visibilityStatus,
      })
      toast.success('Visibility changed.')
      setPlans(plans.map((p) => (p.id === plan.id ? updated.data.data : p)))
    } catch {
      toast.error('Failed to change visibility.')
    }
  }

  // ── Single delete confirm ──────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!planToDelete) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/data-plans/${planToDelete.id}`)
      toast.success(`"${planToDelete.bundleName}" permanently deleted.`)
      setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(planToDelete.id)
        return next
      })
      // Refresh deleted list
      const deletedRes = await api.get('/admin/data-plans/deleted')
      setDeletedPlans(deletedRes.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete data plan.')
    } finally {
      setDeleteLoading(false)
      setPlanToDelete(null)
    }
  }

  // ── Bulk delete confirm ────────────────────────────────────────────────────
  const confirmBulkDelete = async () => {
    setBulkDeleteLoading(true)
    try {
      const ids = Array.from(selectedIds)
      const res = await api.post('/admin/data-plans/bulk-delete', { ids })
      toast.success(res.data.message || `${ids.length} plans permanently deleted.`)
      setPlans((prev) => prev.filter((p) => !selectedIds.has(p.id)))
      setSelectedIds(new Set())
      const deletedRes = await api.get('/admin/data-plans/deleted')
      setDeletedPlans(deletedRes.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk delete failed.')
    } finally {
      setBulkDeleteLoading(false)
      setBulkDeleteOpen(false)
    }
  }

  // ── Restore confirm ────────────────────────────────────────────────────────
  const confirmRestore = async () => {
    if (!planToRestore) return
    setRestoreLoading(true)
    try {
      await api.post(`/admin/data-plans/deleted/${planToRestore.id}/restore`)
      toast.success(`"${planToRestore.bundleName}" restored successfully.`)
      setDeletedPlans((prev) => prev.filter((p) => p.id !== planToRestore.id))
      // Refresh active plans
      const activeRes = await api.get('/admin/data-plans')
      setPlans(activeRes.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore plan.')
    } finally {
      setRestoreLoading(false)
      setPlanToRestore(null)
    }
  }

  // ── Edit helpers ───────────────────────────────────────────────────────────
  const startEdit = (plan: DataPlan) => {
    setEditingId(plan.id)
    setEditingPrice(plan.sellingPrice.toString())
    setEditingAgentPrice((plan.agentPrice || 0).toString())
    setEditingBundleName(plan.bundleName)
    setEditingSmeplugPlanId(plan.smeplugPlanId.toString())
  }

  const savePrice = async (plan: DataPlan) => {
    const priceVal = parseFloat(editingPrice)
    const agentPriceVal = parseFloat(editingAgentPrice)
    const apiPlanIdVal = parseInt(editingSmeplugPlanId, 10)
    if (isNaN(apiPlanIdVal) || apiPlanIdVal <= 0) { toast.error('Please enter a valid API Plan ID.'); return }
    if (isNaN(priceVal) || priceVal < 0) { toast.error('Please enter a valid selling price.'); return }
    if (isNaN(agentPriceVal) || agentPriceVal < 0) { toast.error('Please enter a valid agent price.'); return }
    try {
      const updated = await api.put(`/admin/data-plans/${plan.id}`, {
        smeplugPlanId: apiPlanIdVal,
        bundleName: editingBundleName.trim() || plan.bundleName,
        sellingPrice: priceVal,
        agentPrice: agentPriceVal,
        overrideStatus: true,
      })
      toast.success('Plan details saved successfully.')
      setPlans(plans.map((p) => (p.id === plan.id ? updated.data.data : p)))
      setEditingId(null)
    } catch {
      toast.error('Failed to update price.')
    }
  }

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredPlans = plans.filter((p) => {
    if (activeTab === 'swiftbills') return p.provider === 'swiftbills'
    if (activeTab === 'danmalama') return p.provider === 'danmalama'
    return p.network === activeTab && (!p.provider || p.provider === 'smeplug')
  })

  // ── Bulk select helpers ────────────────────────────────────────────────────
  const allSelected = filteredPlans.length > 0 && filteredPlans.every((p) => selectedIds.has(p.id))
  const someSelected = filteredPlans.some((p) => selectedIds.has(p.id))
  const selectedCount = filteredPlans.filter((p) => selectedIds.has(p.id)).length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredPlans.forEach((p) => next.delete(p.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredPlans.forEach((p) => next.add(p.id))
        return next
      })
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading && plans.length === 0) {
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
    <>
      {/* ── Modals ── */}
      {planToDelete && (
        <DeleteConfirmModal
          plan={planToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setPlanToDelete(null)}
          loading={deleteLoading}
        />
      )}
      {bulkDeleteOpen && (
        <BulkDeleteModal
          count={selectedCount}
          onConfirm={confirmBulkDelete}
          onCancel={() => setBulkDeleteOpen(false)}
          loading={bulkDeleteLoading}
        />
      )}
      {planToRestore && (
        <RestoreModal
          plan={planToRestore}
          onConfirm={confirmRestore}
          onCancel={() => setPlanToRestore(null)}
          loading={restoreLoading}
        />
      )}

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Data Plans Management</h1>
            <p className="text-sm text-silver-muted">
              Manage customer pricing, overrides, visibility and permanently delete unused plans.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'active' ? 'bg-primary-glow text-black' : 'text-silver-muted hover:text-white'}`}
              >
                Active Plans
              </button>
              <button
                onClick={() => setViewMode('deleted')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${viewMode === 'deleted' ? 'bg-red-600 text-white' : 'text-silver-muted hover:text-white'}`}
              >
                Deleted
                {deletedPlans.length > 0 && (
                  <span className={`inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full font-extrabold ${viewMode === 'deleted' ? 'bg-white text-red-600' : 'bg-red-600/80 text-white'}`}>
                    {deletedPlans.length}
                  </span>
                )}
              </button>
            </div>

            {viewMode === 'active' && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Syncing plans...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                    </svg>
                    <span>{activeTab === 'danmalama' ? 'Sync Danmalama plans' : 'Sync SMEPlug plans'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Active Plans View ── */}
        {viewMode === 'active' && (
          <>
            {/* Network / Provider tabs */}
            <div className="flex space-x-2 border-b border-white/5 pb-px overflow-x-auto">
              {[
                { id: 'mtn', name: 'MTN (SMEPlug)' },
                { id: 'airtel', name: 'Airtel' },
                { id: 'glo', name: 'Glo' },
                { id: '9mobile', name: '9mobile' },
                { id: 'swiftbills', name: 'Swiftbills (MTN)' },
                { id: 'danmalama', name: 'Danmalama (MTN/Airtel/Glo)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-6 py-3 text-sm font-bold uppercase border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-glow text-primary-glow font-extrabold'
                      : 'border-transparent text-silver-muted hover:text-white'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Bulk action bar */}
            {selectedCount > 0 && (
              <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="text-sm text-red-300 font-semibold">
                  {selectedCount} plan{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setBulkDeleteOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete {selectedCount} Selected
                </button>
              </div>
            )}

            {/* Plans Table */}
            <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-silver-light border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-silver-muted/10 text-xs font-bold text-silver-muted uppercase tracking-wider">
                      <th className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 cursor-pointer accent-primary-glow"
                        />
                      </th>
                      <th className="px-6 py-4">Plan ID</th>
                      <th className="px-6 py-4">Bundle Name</th>
                      {activeTab === 'danmalama' && <th className="px-6 py-4">Network</th>}
                      <th className="px-6 py-4">{activeTab === 'swiftbills' ? 'Swiftbills Cost' : activeTab === 'danmalama' ? 'Danmalama Cost' : 'SMEPlug Cost'}</th>
                      <th className="px-6 py-4">Selling Price</th>
                      <th className="px-6 py-4">Agent Price</th>
                      <th className="px-6 py-4">Override</th>
                      <th className="px-6 py-4">Visibility</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPlans.length === 0 ? (
                      <tr>
                        <td colSpan={activeTab === 'danmalama' ? 10 : 9} className="px-6 py-10 text-center text-silver-muted font-medium">
                          No active plans synced for this network yet. Try clicking "{activeTab === 'danmalama' ? 'Sync Danmalama plans' : 'Sync SMEPlug plans'}".
                        </td>
                      </tr>
                    ) : (
                      filteredPlans.map((plan) => (
                        <tr
                          key={plan.id}
                          className={`hover:bg-white/[0.02] transition-colors ${selectedIds.has(plan.id) ? 'bg-red-500/5' : ''}`}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(plan.id)}
                              onChange={() => toggleSelect(plan.id)}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 cursor-pointer accent-primary-glow"
                            />
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {editingId === plan.id ? (
                              <input
                                type="number"
                                value={editingSmeplugPlanId}
                                onChange={(e) => setEditingSmeplugPlanId(e.target.value)}
                                className="w-16 bg-dark-bg border border-primary-glow/50 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none"
                              />
                            ) : (
                              plan.smeplugPlanId
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold text-white">
                            {editingId === plan.id ? (
                              <input
                                type="text"
                                value={editingBundleName}
                                onChange={(e) => setEditingBundleName(e.target.value)}
                                className="w-full bg-dark-bg border border-primary-glow/50 rounded px-2 py-1 text-white text-sm focus:outline-none"
                              />
                            ) : (
                              plan.bundleName
                            )}
                          </td>
                          {activeTab === 'danmalama' && (
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                plan.network === 'mtn' ? 'bg-yellow-400/10 text-yellow-300 border-yellow-400/20'
                                : plan.network === 'airtel' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : plan.network === 'glo' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              }`}>
                                {plan.network?.toUpperCase() || 'N/A'}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 font-mono">₦{plan.smeplugCost.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            {editingId === plan.id ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-silver-muted">₦</span>
                                <input type="number" value={editingPrice} onChange={(e) => setEditingPrice(e.target.value)}
                                  className="w-24 bg-dark-bg border border-primary-glow/50 rounded px-2 py-1 text-white font-mono text-sm focus:outline-none" autoFocus />
                              </div>
                            ) : (
                              <span className="font-bold text-primary-glow font-mono">₦{plan.sellingPrice.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingId === plan.id ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-silver-muted">₦</span>
                                <input type="number" value={editingAgentPrice} onChange={(e) => setEditingAgentPrice(e.target.value)}
                                  className="w-24 bg-dark-bg border border-primary-glow/50 rounded px-2 py-1 text-white font-mono text-sm focus:outline-none" />
                              </div>
                            ) : (
                              <span className="font-bold text-purple-400 font-mono">₦{(plan.agentPrice || 0).toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                              plan.overrideStatus ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/5 text-silver-muted border-white/5'
                            }`}>
                              {plan.overrideStatus ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                              plan.visibilityStatus ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {plan.visibilityStatus ? 'Visible' : 'Hidden'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {editingId === plan.id ? (
                                <>
                                  <button onClick={() => savePrice(plan)} className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors">Save</button>
                                  <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors">Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(plan)} className="px-3 py-1 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/10 transition-colors">Edit</button>
                                  <button
                                    onClick={() => toggleOverride(plan)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                                      plan.overrideStatus ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-white/5 text-silver-muted border-white/5 hover:text-white hover:bg-white/10'
                                    }`}
                                  >
                                    {plan.overrideStatus ? 'Disable Override' : 'Enable Override'}
                                  </button>
                                  <button
                                    onClick={() => toggleVisibility(plan)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                                      plan.visibilityStatus ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                    }`}
                                  >
                                    {plan.visibilityStatus ? 'Hide Plan' : 'Show Plan'}
                                  </button>
                                  <button
                                    onClick={() => setPlanToDelete(plan)}
                                    className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Deleted Plans View ── */}
        {viewMode === 'deleted' && (
          <div className="bg-dark-bg-secondary/40 border border-red-500/10 rounded-2xl glass-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Permanently Deleted Plans</h3>
                <p className="text-xs text-silver-muted mt-0.5">
                  These plans have been removed and will never be re-created during sync. You can restore them if needed.
                </p>
              </div>
              {deletedPlans.length > 0 && (
                <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full">
                  {deletedPlans.length} deleted
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-silver-light border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-silver-muted/10 text-xs font-bold text-silver-muted uppercase tracking-wider">
                    <th className="px-6 py-4">Plan ID</th>
                    <th className="px-6 py-4">Bundle Name</th>
                    <th className="px-6 py-4">Provider</th>
                    <th className="px-6 py-4">Network</th>
                    <th className="px-6 py-4">Cost Price</th>
                    <th className="px-6 py-4">Deleted By</th>
                    <th className="px-6 py-4">Deleted At</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deletedPlans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-silver-muted font-medium">
                        No deleted plans. Plans you permanently delete will appear here and can be restored.
                      </td>
                    </tr>
                  ) : (
                    deletedPlans.map((dp) => (
                      <tr key={dp.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-silver-muted">{dp.smeplugPlanId}</td>
                        <td className="px-6 py-4 font-semibold text-white">{dp.bundleName || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            dp.provider === 'danmalama' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            : dp.provider === 'swiftbills' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : 'bg-white/5 text-silver-muted border-white/10'
                          }`}>
                            {dp.provider || 'smeplug'}
                          </span>
                        </td>
                        <td className="px-6 py-4 uppercase text-xs font-semibold text-silver-muted">{dp.network || '—'}</td>
                        <td className="px-6 py-4 font-mono text-silver-muted">₦{(dp.costPrice || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-silver-muted text-xs">{dp.deletedBy || 'admin'}</td>
                        <td className="px-6 py-4 text-silver-muted text-xs">
                          {new Date(dp.deletedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setPlanToRestore(dp)}
                            className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 mx-auto"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
