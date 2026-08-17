'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────

interface PushLog {
  id: string
  title: string
  body: string
  targetType: string
  targetValue: string | null
  successCount: number
  failureCount: number
  sentBy: string | null
  createdAt: string
}

type TargetType = 'all' | 'agents' | 'user'

// ── Quick templates ──────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    label: '📣 Promotion',
    title: '🎉 Special Offer — Limited Time!',
    body: 'Enjoy discounted data rates this weekend! Log in now to take advantage of our exclusive deals.',
  },
  {
    label: '⚙️ Maintenance',
    title: '⚙️ Scheduled Maintenance',
    body: 'We are undergoing scheduled maintenance. Some services may be temporarily unavailable. We apologize for any inconvenience.',
  },
  {
    label: '📈 Rate Update',
    title: '📈 Data Rate Update',
    body: 'Data rates have been updated. Check available plans for the latest pricing.',
  },
  {
    label: '🆕 New Feature',
    title: '🆕 New Feature Available!',
    body: 'We just launched new features on AB Data Hub. Update your app and explore what\'s new!',
  },
  {
    label: '⚠️ Downtime',
    title: '⚠️ Service Disruption Notice',
    body: 'We\'re experiencing some service disruptions. Our team is actively working to resolve this. Thank you for your patience.',
  },
]

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  // ── Banner notification (existing feature) ─────────────────────────────
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  // ── Push notification state ────────────────────────────────────────────
  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  const [pushImageUrl, setPushImageUrl] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('all')
  const [targetValue, setTargetValue] = useState('')
  const [sending, setSending] = useState(false)
  const [activeTokenCount, setActiveTokenCount] = useState<number | null>(null)
  const [pushLogs, setPushLogs] = useState<PushLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'push' | 'banner'>('push')

  // ── Load banner settings + push stats ─────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const [settingsRes, statsRes, logsRes] = await Promise.allSettled([
          api.get('/admin/settings'),
          api.get('/notifications/stats'),
          api.get('/notifications/history?limit=20'),
        ])

        if (settingsRes.status === 'fulfilled') {
          const settings = settingsRes.value.data.data
          setNotificationEnabled(settings.notificationEnabled ?? false)
          setNotificationMessage(settings.notificationMessage ?? '')
        }

        if (statsRes.status === 'fulfilled') {
          setActiveTokenCount(statsRes.value.data.data?.activeTokens ?? 0)
        }

        if (logsRes.status === 'fulfilled') {
          setPushLogs(logsRes.value.data.data ?? [])
        }
      } catch (err) {
        console.error('Error initialising notification page:', err)
        toast.error('Failed to load notification data')
      } finally {
        setLoading(false)
        setLogsLoading(false)
      }
    }
    init()
  }, [])

  // ── Save banner settings ────────────────────────────────────────────────
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/admin/settings', {
        notificationEnabled,
        notificationMessage: notificationMessage.trim() || null,
      })
      toast.success('Banner notification settings saved!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // ── Send push notification ──────────────────────────────────────────────
  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushTitle.trim() || !pushBody.trim()) {
      toast.error('Title and message body are required')
      return
    }
    if (targetType === 'user' && !targetValue.trim()) {
      toast.error('Please enter a user ID, email, or phone number')
      return
    }

    setSending(true)
    try {
      const res = await api.post('/notifications/send', {
        title: pushTitle.trim(),
        body: pushBody.trim(),
        ...(pushImageUrl.trim() ? { imageUrl: pushImageUrl.trim() } : {}),
        targetType,
        ...(targetType === 'user' ? { targetValue: targetValue.trim() } : {}),
      })

      const data = res.data
      toast.success(data.message || 'Push notification sent!')

      // Refresh logs
      const logsRes = await api.get('/notifications/history?limit=20')
      setPushLogs(logsRes.data.data ?? [])

      // Refresh active token count
      const statsRes = await api.get('/notifications/stats')
      setActiveTokenCount(statsRes.data.data?.activeTokens ?? 0)

      // Clear form
      setPushTitle('')
      setPushBody('')
      setPushImageUrl('')
      setTargetValue('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send push notification')
    } finally {
      setSending(false)
    }
  }

  // ── Target label helpers ────────────────────────────────────────────────
  const targetLabel: Record<TargetType, string> = {
    all: 'All App Users',
    agents: 'Verified Agents Only',
    user: 'Specific User',
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-silver-light">Notification Manager</h1>
          <p className="text-sm text-silver-muted mt-1">
            Send real-time push notifications to users and manage dashboard banners.
          </p>
        </div>
        {activeTokenCount !== null && (
          <div className="bg-primary-glow/10 border border-primary-glow/20 rounded-xl px-4 py-3 text-center shrink-0">
            <p className="text-2xl font-bold text-primary-glow">{activeTokenCount.toLocaleString()}</p>
            <p className="text-xs text-silver-muted mt-0.5">Active Devices</p>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-dark-bg/50 border border-silver-muted/10 rounded-xl p-1">
        {(['push', 'banner'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 capitalize ${
              activeTab === tab
                ? 'bg-primary-glow text-white shadow-glow-blue'
                : 'text-silver-muted hover:text-silver-light'
            }`}
          >
            {tab === 'push' ? '📲 Push Notifications' : '📢 Dashboard Banner'}
          </button>
        ))}
      </div>

      {/* ── PUSH NOTIFICATION TAB ── */}
      {activeTab === 'push' && (
        <div className="space-y-6">
          {/* Composer */}
          <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-6 glass-dark space-y-5">
            <h2 className="text-base font-bold text-silver-light">Compose Push Notification</h2>

            <form onSubmit={handleSendPush} className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  Notification Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="e.g. 🎉 Weekend Data Promo!"
                  maxLength={100}
                  className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-sm text-silver-light placeholder:text-silver-muted/40 focus:border-primary-glow/50 focus:outline-none transition-all"
                />
                <p className="text-xs text-silver-muted text-right">{pushTitle.length}/100</p>
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  Message Body <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value)}
                  placeholder="Enter the notification message..."
                  rows={4}
                  maxLength={500}
                  className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-sm text-silver-light placeholder:text-silver-muted/40 focus:border-primary-glow/50 focus:outline-none transition-all resize-none"
                />
                <p className="text-xs text-silver-muted text-right">{pushBody.length}/500</p>
              </div>

              {/* Image URL (optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  Image URL <span className="text-silver-muted/50 normal-case font-normal">(optional)</span>
                </label>
                <input
                  value={pushImageUrl}
                  onChange={(e) => setPushImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.png"
                  className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-sm text-silver-light placeholder:text-silver-muted/40 focus:border-primary-glow/50 focus:outline-none transition-all"
                />
              </div>

              {/* Target selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  Target Audience <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'agents', 'user'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTargetType(t)}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                        targetType === t
                          ? 'bg-primary-glow/15 border-primary-glow text-primary-glow'
                          : 'border-silver-muted/10 text-silver-muted hover:border-primary-glow/30 hover:text-silver-light'
                      }`}
                    >
                      {t === 'all' ? '🌐 All Users' : t === 'agents' ? '💼 Agents' : '👤 One User'}
                    </button>
                  ))}
                </div>

                {targetType === 'user' && (
                  <input
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="User ID, email or phone number"
                    className="w-full mt-2 bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-sm text-silver-light placeholder:text-silver-muted/40 focus:border-primary-glow/50 focus:outline-none transition-all"
                  />
                )}

                <p className="text-xs text-silver-muted">
                  Target: <span className="text-primary-glow font-semibold">{targetLabel[targetType]}</span>
                </p>
              </div>

              {/* Quick templates */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-silver-muted uppercase tracking-wider">Quick Templates</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => {
                        setPushTitle(tpl.title)
                        setPushBody(tpl.body)
                      }}
                      className="px-3 py-1.5 text-xs border border-primary-glow/30 text-primary-glow rounded-lg hover:bg-primary-glow/10 transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setPushTitle(''); setPushBody(''); setPushImageUrl('') }}
                    className="px-3 py-1.5 text-xs border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Live preview */}
              {(pushTitle || pushBody) && (
                <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">📱 Device Preview</p>
                  <div className="bg-dark-bg rounded-lg p-3 border border-white/5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-glow/20 flex items-center justify-center text-sm shrink-0">
                        📲
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{pushTitle || 'Notification Title'}</p>
                        <p className="text-xs text-silver-muted mt-0.5 line-clamp-2">{pushBody || 'Message body...'}</p>
                        <p className="text-[10px] text-silver-muted/50 mt-1">AB Data Hub • now</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Send button */}
              <button
                type="submit"
                disabled={sending || !pushTitle.trim() || !pushBody.trim()}
                className="w-full py-3.5 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-40 text-sm flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>📲 Send Push Notification</span>
                )}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-6 glass-dark">
            <h2 className="text-base font-bold text-silver-light mb-4">Recent Push History</h2>
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-primary-glow" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : pushLogs.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-silver-muted text-sm">No push notifications sent yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pushLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border border-silver-muted/10 rounded-xl bg-dark-bg/30 hover:bg-dark-bg/60 transition-colors"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-glow/10 border border-primary-glow/20 flex items-center justify-center text-lg">
                      📲
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-silver-light truncate">{log.title}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          log.targetType === 'all'
                            ? 'bg-blue-500/15 text-blue-400'
                            : log.targetType === 'agents'
                            ? 'bg-purple-500/15 text-purple-400'
                            : 'bg-orange-500/15 text-orange-400'
                        }`}>
                          {log.targetType === 'all' ? '🌐 All' : log.targetType === 'agents' ? '💼 Agents' : '👤 User'}
                        </span>
                      </div>
                      <p className="text-xs text-silver-muted mt-0.5 line-clamp-1">{log.body}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-green-400">✓ {log.successCount} delivered</span>
                        {log.failureCount > 0 && (
                          <span className="text-xs text-red-400">✗ {log.failureCount} failed</span>
                        )}
                        <span className="text-xs text-silver-muted/50">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        {log.sentBy && (
                          <span className="text-xs text-silver-muted/50">by {log.sentBy}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BANNER TAB ── */}
      {activeTab === 'banner' && (
        <div className="space-y-6">
          {notificationEnabled && notificationMessage && (
            <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">Live Banner Preview</p>
                <p className="text-sm text-silver-light whitespace-pre-line">{notificationMessage}</p>
              </div>
            </div>
          )}

          <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-6 glass-dark space-y-6">
            <form onSubmit={handleSaveBanner} className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-silver-muted/10 rounded-xl bg-dark-bg/40">
                <div>
                  <p className="text-sm font-semibold text-silver-light">Enable Dashboard Banner</p>
                  <p className="text-xs text-silver-muted mt-0.5">
                    Users will see this message as a popup on their dashboard.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notificationEnabled ? 'bg-primary-glow' : 'bg-silver-muted/20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  Banner Message
                </label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter the notification message to show users..."
                  rows={6}
                  className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-sm text-silver-light placeholder:text-silver-muted/40 focus:border-primary-glow/50 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-silver-muted uppercase tracking-wider">Quick Templates</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Maintenance', msg: 'We are currently undergoing scheduled maintenance. Some services may be temporarily unavailable. We apologize for any inconvenience.' },
                    { label: 'Downtime Notice', msg: 'We are experiencing some service disruptions. Our team is actively working to resolve this. Thank you for your patience.' },
                    { label: 'New Feature', msg: 'Exciting news! We have just launched new features. Check out our latest updates!' },
                    { label: 'Rate Update', msg: 'Data rates have been updated. Please check available plans for the latest pricing.' },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setNotificationMessage(tpl.msg)}
                      className="px-3 py-1.5 text-xs border border-primary-glow/30 text-primary-glow rounded-lg hover:bg-primary-glow/10 transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNotificationMessage('')}
                    className="px-3 py-1.5 text-xs border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Banner Settings</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
