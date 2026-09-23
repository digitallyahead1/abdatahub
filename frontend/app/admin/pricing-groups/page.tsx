'use client'

import { useState, useEffect, useMemo } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface PricingGroupItem {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  memberCount: number
  planCount: number
}

interface GroupMember {
  id: string
  userId: string
  fullName: string
  email: string
  role?: string
  addedAt: string
}

interface GroupPlanPrice {
  id: string
  planId: string
  network: string
  bundleName: string
  sellingPrice: number
  groupPrice: number
  updatedAt: string
}

interface DataPlan {
  id: string
  smeplugPlanId: number
  network: string
  bundleName: string
  smeplugCost: number
  sellingPrice: number
  agentPrice: number
  visibilityStatus: boolean
  provider?: string
}

interface UserOption {
  id: string
  fullName: string
  email: string
  role: string
  status?: string
}

export default function PricingGroupsPage() {
  const [groups, setGroups] = useState<PricingGroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // Selected Group Full Detail
  const [groupDetail, setGroupDetail] = useState<{
    id: string
    name: string
    description?: string
    isActive: boolean
    members: GroupMember[]
    planPrices: GroupPlanPrice[]
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Master Data Plans
  const [allPlans, setAllPlans] = useState<DataPlan[]>([])

  // Master Users for "Add Member"
  const [allUsers, setAllUsers] = useState<UserOption[]>([])

  // Group Details Active Tab
  const [activeTab, setActiveTab] = useState<'plans' | 'members'>('plans')
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')
  const [planSearch, setPlanSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)

  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [addingUserId, setAddingUserId] = useState<string | null>(null)

  // In-line price editing states: planId -> string value
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({})
  const [savingPricePlanId, setSavingPricePlanId] = useState<string | null>(null)

  // Fetch all groups
  const fetchGroups = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/pricing-groups')
      if (res.data.success) {
        setGroups(res.data.data)
        if (!selectedGroupId && res.data.data.length > 0) {
          setSelectedGroupId(res.data.data[0].id)
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load pricing groups.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch plans
  const fetchPlans = async () => {
    try {
      const res = await api.get('/admin/data-plans')
      if (res.data.success) {
        setAllPlans(res.data.data)
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  // Fetch users for member assignment
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      if (res.data.success) {
        setAllUsers(res.data.data)
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  // Fetch single group details
  const fetchGroupDetail = async (groupId: string) => {
    try {
      setDetailLoading(true)
      const res = await api.get(`/admin/pricing-groups/${groupId}`)
      if (res.data.success) {
        setGroupDetail(res.data.data)
        // Initialize price inputs with existing custom prices
        const inputs: Record<string, string> = {}
        res.data.data.planPrices.forEach((p: GroupPlanPrice) => {
          inputs[p.planId] = String(p.groupPrice)
        })
        setPriceInputs(inputs)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load group details.')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
    fetchPlans()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetail(selectedGroupId)
    }
  }, [selectedGroupId])

  // Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name.')
      return
    }
    try {
      setCreatingGroup(true)
      const res = await api.post('/admin/pricing-groups', {
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || undefined,
      })
      if (res.data.success) {
        toast.success(`Pricing group "${res.data.data.name}" created!`)
        setShowCreateModal(false)
        setNewGroupName('')
        setNewGroupDesc('')
        await fetchGroups()
        setSelectedGroupId(res.data.data.id)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create group.')
    } finally {
      setCreatingGroup(false)
    }
  }

  // Edit Group
  const openEditModal = () => {
    if (!groupDetail) return
    setEditName(groupDetail.name)
    setEditDesc(groupDetail.description || '')
    setEditActive(groupDetail.isActive)
    setShowEditModal(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroupId || !editName.trim()) return
    try {
      setSavingEdit(true)
      const res = await api.patch(`/admin/pricing-groups/${selectedGroupId}`, {
        name: editName.trim(),
        description: editDesc.trim(),
        isActive: editActive,
      })
      if (res.data.success) {
        toast.success('Group updated successfully!')
        setShowEditModal(false)
        await fetchGroups()
        await fetchGroupDetail(selectedGroupId)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update group.')
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete Group
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete group "${groupName}"? Custom pricing and member assignments will be removed.`)) {
      return
    }
    try {
      const res = await api.delete(`/admin/pricing-groups/${groupId}`)
      if (res.data.success) {
        toast.success(`Group "${groupName}" deleted.`)
        setSelectedGroupId(null)
        setGroupDetail(null)
        await fetchGroups()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete group.')
    }
  }

  // Save Custom Plan Price
  const handleSavePlanPrice = async (planId: string) => {
    if (!selectedGroupId) return
    const rawVal = priceInputs[planId]
    if (rawVal === undefined || rawVal === '' || isNaN(Number(rawVal)) || Number(rawVal) <= 0) {
      toast.error('Please enter a valid price amount greater than 0.')
      return
    }
    try {
      setSavingPricePlanId(planId)
      const res = await api.post(`/admin/pricing-groups/${selectedGroupId}/plans`, {
        planId,
        price: Number(rawVal),
      })
      if (res.data.success) {
        toast.success('Custom price saved!')
        await fetchGroupDetail(selectedGroupId)
        await fetchGroups()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save plan price.')
    } finally {
      setSavingPricePlanId(null)
    }
  }

  // Remove Custom Plan Price (revert to default)
  const handleRemovePlanPrice = async (planId: string) => {
    if (!selectedGroupId) return
    try {
      setSavingPricePlanId(planId)
      const res = await api.delete(`/admin/pricing-groups/${selectedGroupId}/plans/${planId}`)
      if (res.data.success) {
        toast.success('Reverted to standard plan price.')
        setPriceInputs((prev) => {
          const next = { ...prev }
          delete next[planId]
          return next
        })
        await fetchGroupDetail(selectedGroupId)
        await fetchGroups()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove plan price.')
    } finally {
      setSavingPricePlanId(null)
    }
  }

  // Add Member to Group
  const handleAddMember = async (userId: string) => {
    if (!selectedGroupId) return
    try {
      setAddingUserId(userId)
      const res = await api.post(`/admin/pricing-groups/${selectedGroupId}/members`, { userId })
      if (res.data.success) {
        toast.success(`User added to ${groupDetail?.name || 'group'}!`)
        await fetchGroupDetail(selectedGroupId)
        await fetchGroups()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add member.')
    } finally {
      setAddingUserId(null)
    }
  }

  // Remove Member from Group
  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!selectedGroupId) return
    if (!confirm(`Remove ${memberName} from this pricing group?`)) return
    try {
      const res = await api.delete(`/admin/pricing-groups/${selectedGroupId}/members/${userId}`)
      if (res.data.success) {
        toast.success(`${memberName} removed from group.`)
        await fetchGroupDetail(selectedGroupId)
        await fetchGroups()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member.')
    }
  }

  // Batch action: Set all filtered plans to Agent Price
  const handleApplyAgentPrices = async () => {
    if (!selectedGroupId || !confirm('Set custom group price equal to Agent Price for all matching plans?')) return
    const targets = filteredPlans.filter((p) => Number(p.agentPrice) > 0)
    if (targets.length === 0) {
      toast.error('No plans with agent prices found in this view.')
      return
    }
    toast.loading('Applying agent prices to group...')
    try {
      for (const p of targets) {
        await api.post(`/admin/pricing-groups/${selectedGroupId}/plans`, {
          planId: p.id,
          price: Number(p.agentPrice),
        })
      }
      toast.dismiss()
      toast.success(`Applied agent pricing to ${targets.length} plans!`)
      await fetchGroupDetail(selectedGroupId)
      await fetchGroups()
    } catch (err: any) {
      toast.dismiss()
      toast.error('Some prices could not be applied.')
    }
  }

  // Filtered Plans Matrix
  const filteredPlans = useMemo(() => {
    return allPlans.filter((p) => {
      const matchNetwork = selectedNetwork === 'all' || p.network.toLowerCase() === selectedNetwork.toLowerCase()
      const matchSearch =
        !planSearch.trim() ||
        p.bundleName.toLowerCase().includes(planSearch.toLowerCase()) ||
        p.network.toLowerCase().includes(planSearch.toLowerCase())
      return matchNetwork && matchSearch
    })
  }, [allPlans, selectedNetwork, planSearch])

  // Filtered Users for Add Member Modal
  const currentMemberIds = useMemo(() => {
    return new Set(groupDetail?.members.map((m) => m.userId) || [])
  }, [groupDetail])

  const filteredUsersToAdd = useMemo(() => {
    return allUsers.filter((u) => {
      if (currentMemberIds.has(u.id)) return false
      if (!userSearchQuery.trim()) return true
      const q = userSearchQuery.toLowerCase()
      return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
  }, [allUsers, currentMemberIds, userSearchQuery])

  // Custom price lookup map for fast rendering
  const groupPriceMap = useMemo(() => {
    const map = new Map<string, number>()
    groupDetail?.planPrices.forEach((gp) => {
      map.set(gp.planId, Number(gp.groupPrice))
    })
    return map
  }, [groupDetail])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-glow/10 border border-primary-glow/20 text-primary-glow">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Group Pricing Hub</h1>
              <p className="text-sm text-slate-400">
                Create special customer groups, assign dedicated VIP/Wholesale rates, and attach users or API developers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-primary-glow to-blue-600 text-white shadow-lg shadow-primary-glow/20 hover:opacity-95 transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Pricing Group
        </button>
      </div>

      {/* Main Grid: Groups Sidebar (Left) + Detail Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Groups Navigation Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Pricing Groups ({groups.length})
            </h2>
            <button
              onClick={fetchGroups}
              className="text-xs text-primary-glow hover:underline flex items-center gap-1"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-dark-surface/50 border border-dark-border rounded-2xl">
              <svg className="animate-spin h-6 w-6 text-primary-glow mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs text-slate-400">Loading pricing groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-8 text-center bg-dark-surface/50 border border-dark-border rounded-2xl">
              <p className="text-sm text-slate-300 font-medium">No pricing groups yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Create a group like &quot;VIP Resellers&quot; or &quot;API Wholesalers&quot; to set custom rates.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 text-xs text-primary-glow hover:underline"
              >
                + Create first group
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {groups.map((g) => {
                const isSelected = selectedGroupId === g.id
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-dark-surface border-primary-glow/50 shadow-lg shadow-primary-glow/5 ring-1 ring-primary-glow/30'
                        : 'bg-dark-surface/60 border-dark-border hover:border-slate-600 hover:bg-dark-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-white truncate">{g.name}</h3>
                          {g.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              Inactive
                            </span>
                          )}
                        </div>
                        {g.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{g.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-border/40 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-primary-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <strong className="text-slate-200">{g.memberCount}</strong> members
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                        <strong className="text-slate-200">{g.planCount}</strong> custom prices
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Group Workspace (8 cols) */}
        <div className="lg:col-span-8">
          {detailLoading ? (
            <div className="h-96 flex flex-col items-center justify-center bg-dark-surface/40 border border-dark-border/60 rounded-3xl p-8 text-center text-slate-400">
              <svg className="animate-spin h-8 w-8 text-primary-glow mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-slate-400">Loading group details &amp; plan prices...</p>
            </div>
          ) : !selectedGroupId || !groupDetail ? (
            <div className="h-96 flex flex-col items-center justify-center bg-dark-surface/40 border border-dark-border/60 rounded-3xl p-8 text-center text-slate-400">
              <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-base font-medium text-slate-300">Select a pricing group</p>
              <p className="text-xs text-slate-500 mt-1">Choose a group on the left to configure members and special plan prices.</p>
            </div>
          ) : (
            <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 space-y-6 shadow-xl">
              {/* Group Workspace Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dark-border/60">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white tracking-tight">{groupDetail.name}</h2>
                    {groupDetail.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Live Pricing
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Paused (Inactive)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {groupDetail.description || 'No description provided for this group.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openEditModal}
                    className="px-3 py-1.5 rounded-xl border border-dark-border hover:border-slate-500 bg-dark-bg/60 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Settings
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(groupDetail.id, groupDetail.name)}
                    className="px-3 py-1.5 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-xs font-medium text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>

              {/* Tabs Switcher: Custom Prices vs Group Members */}
              <div className="flex items-center justify-between border-b border-dark-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('plans')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                      activeTab === 'plans'
                        ? 'bg-primary-glow text-white shadow-md shadow-primary-glow/20'
                        : 'text-slate-400 hover:text-white hover:bg-dark-bg/60'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Plan Pricing Matrix ({groupDetail.planPrices.length} Custom)
                  </button>
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                      activeTab === 'members'
                        ? 'bg-primary-glow text-white shadow-md shadow-primary-glow/20'
                        : 'text-slate-400 hover:text-white hover:bg-dark-bg/60'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0-.001h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Assigned Members ({groupDetail.members.length})
                  </button>
                </div>

                {activeTab === 'plans' && (
                  <button
                    onClick={handleApplyAgentPrices}
                    className="text-xs text-slate-300 hover:text-white bg-dark-bg/60 hover:bg-dark-bg px-3 py-1.5 rounded-lg border border-dark-border/80 transition-colors flex items-center gap-1.5"
                    title="Quickly fill group price with Agent Price for this view"
                  >
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Set to Agent Price
                  </button>
                )}

                {activeTab === 'members' && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="text-xs text-white bg-primary-glow hover:opacity-90 px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Member
                  </button>
                )}
              </div>

              {/* TAB 1: Plan Pricing Matrix */}
              {activeTab === 'plans' && (
                <div className="space-y-4">
                  {/* Filters: Network pills + Search */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {['all', 'mtn', 'airtel', 'glo', '9mobile'].map((net) => (
                        <button
                          key={net}
                          onClick={() => setSelectedNetwork(net)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                            selectedNetwork === net
                              ? 'bg-primary-glow/20 text-primary-glow border border-primary-glow/40'
                              : 'bg-dark-bg/60 text-slate-400 hover:text-slate-200 border border-dark-border/40'
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search plans by name/size..."
                        value={planSearch}
                        onChange={(e) => setPlanSearch(e.target.value)}
                        className="w-full sm:w-64 bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-glow/60"
                      />
                      {planSearch && (
                        <button
                          onClick={() => setPlanSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Plan Price Table */}
                  <div className="overflow-x-auto rounded-2xl border border-dark-border/60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-dark-bg/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-dark-border/60">
                        <tr>
                          <th className="py-3 px-4">Network & Plan</th>
                          <th className="py-3 px-4">Base Selling</th>
                          <th className="py-3 px-4">Agent Price</th>
                          <th className="py-3 px-4">Group Price (₦)</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border/40">
                        {filteredPlans.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              No data plans match your filter.
                            </td>
                          </tr>
                        ) : (
                          filteredPlans.map((plan) => {
                            const customPrice = groupPriceMap.get(plan.id)
                            const isCustom = customPrice !== undefined
                            const inputVal = priceInputs[plan.id] ?? (isCustom ? String(customPrice) : '')
                            const isSaving = savingPricePlanId === plan.id

                            const netColor =
                              plan.network.toLowerCase() === 'mtn'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : plan.network.toLowerCase() === 'airtel'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : plan.network.toLowerCase() === 'glo'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-lime-500/10 text-lime-400 border-lime-500/20'

                            return (
                              <tr key={plan.id} className="hover:bg-dark-bg/40 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${netColor}`}>
                                      {plan.network}
                                    </span>
                                    <div>
                                      <p className="font-semibold text-white">{plan.bundleName}</p>
                                      <p className="text-[10px] text-slate-500">ID: {plan.smeplugPlanId}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-300">
                                  ₦{Number(plan.sellingPrice).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-400">
                                  {Number(plan.agentPrice) > 0 ? `₦${Number(plan.agentPrice).toLocaleString()}` : '—'}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500 font-mono text-xs">₦</span>
                                    <input
                                      type="number"
                                      value={inputVal}
                                      placeholder={String(plan.sellingPrice)}
                                      onChange={(e) =>
                                        setPriceInputs((prev) => ({
                                          ...prev,
                                          [plan.id]: e.target.value,
                                        }))
                                      }
                                      className={`w-28 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border bg-dark-bg focus:outline-none transition-all ${
                                        isCustom
                                          ? 'border-primary-glow/60 text-primary-glow focus:border-primary-glow'
                                          : 'border-dark-border text-slate-200 focus:border-slate-500'
                                      }`}
                                    />
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {isCustom ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-glow/10 text-primary-glow border border-primary-glow/20">
                                      Custom Price
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                      Default
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      disabled={isSaving || !inputVal}
                                      onClick={() => handleSavePlanPrice(plan.id)}
                                      className="px-2.5 py-1 rounded-lg font-medium text-[11px] bg-primary-glow/20 hover:bg-primary-glow/30 text-primary-glow border border-primary-glow/30 transition-all disabled:opacity-40"
                                    >
                                      {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    {isCustom && (
                                      <button
                                        disabled={isSaving}
                                        onClick={() => handleRemovePlanPrice(plan.id)}
                                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                        title="Reset to default price"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: Group Members */}
              {activeTab === 'members' && (
                <div className="space-y-4">
                  {/* Search member input */}
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Filter current group members by name/email..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full sm:w-80 bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-glow/60"
                    />
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-primary-glow hover:opacity-90 text-white text-xs font-medium transition-all"
                    >
                      + Add New Member
                    </button>
                  </div>

                  {/* Members Table */}
                  <div className="overflow-x-auto rounded-2xl border border-dark-border/60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-dark-bg/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-dark-border/60">
                        <tr>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Added Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border/40">
                        {groupDetail.members.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-500">
                              No members currently in this pricing group. Click &quot;Add Member&quot; to assign users.
                            </td>
                          </tr>
                        ) : (
                          groupDetail.members
                            .filter((m) => {
                              if (!memberSearch.trim()) return true
                              const q = memberSearch.toLowerCase()
                              return (
                                (m.fullName && m.fullName.toLowerCase().includes(q)) ||
                                (m.email && m.email.toLowerCase().includes(q))
                              )
                            })
                            .map((m) => (
                              <tr key={m.id} className="hover:bg-dark-bg/40 transition-colors">
                                <td className="py-3 px-4">
                                  <div>
                                    <p className="font-semibold text-white">{m.fullName || 'Unnamed User'}</p>
                                    <p className="text-[11px] text-slate-400">{m.email}</p>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/50 text-slate-300 border border-slate-600/40">
                                    {m.role || 'user'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-400">
                                  {new Date(m.addedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleRemoveMember(m.userId, m.fullName || m.email)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                                  >
                                    Remove
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
          )}
        </div>
      </div>

      {/* MODAL: Create Group */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border/60">
              <h3 className="text-lg font-bold text-white">Create Pricing Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Resellers, API Wholesalers"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-glow"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Special bulk data rates for high-volume resellers..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-glow resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border/40">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-glow hover:opacity-95 text-white shadow-md shadow-primary-glow/20 disabled:opacity-50"
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Group */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border/60">
              <h3 className="text-lg font-bold text-white">Edit Pricing Group</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-glow"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-glow resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-glow focus:ring-primary-glow"
                />
                <label htmlFor="activeToggle" className="text-xs text-slate-300 select-none">
                  Group is Active (prices will apply on member purchases)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border/40">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-glow hover:opacity-95 text-white shadow-md shadow-primary-glow/20 disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Member */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border/60">
              <div>
                <h3 className="text-lg font-bold text-white">Add Member to {groupDetail?.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick a platform user or API developer to grant this group&apos;s custom pricing.
                </p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by user name or email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-glow"
            />

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredUsersToAdd.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-500">No matching users found.</p>
              ) : (
                filteredUsersToAdd.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-dark-bg/60 border border-dark-border/60 hover:border-slate-600 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{u.fullName}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                      <span className="inline-block mt-1 uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {u.role}
                      </span>
                    </div>

                    <button
                      disabled={addingUserId === u.id}
                      onClick={() => handleAddMember(u.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-glow/20 hover:bg-primary-glow text-primary-glow hover:text-white border border-primary-glow/30 transition-all disabled:opacity-50"
                    >
                      {addingUserId === u.id ? 'Adding...' : 'Add to Group'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-dark-border/40">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
