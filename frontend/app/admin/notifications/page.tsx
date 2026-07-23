'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await api.get('/admin/settings')
        const settings = response.data.data
        setNotificationEnabled(settings.notificationEnabled ?? false)
        setNotificationMessage(settings.notificationMessage ?? '')
      } catch (err) {
        console.error('Error fetching notification settings:', err)
        toast.error('Failed to load notification settings')
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
        notificationEnabled,
        notificationMessage: notificationMessage.trim() || null,
      })
      toast.success('Notification settings saved successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save notification settings')
    } finally {
      setSaving(false)
    }
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
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-silver-light">Notification Manager</h1>
        <p className="text-sm text-silver-muted mt-1">
          Manage the popup notification shown to all users when they visit the dashboard.
        </p>
      </div>

      {notificationEnabled && notificationMessage && (
        <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">Live Preview</p>
            <p className="text-sm text-silver-light whitespace-pre-line">{notificationMessage}</p>
          </div>
        </div>
      )}

      <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-6 glass-dark space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between p-4 border border-silver-muted/10 rounded-xl bg-dark-bg/40">
            <div>
              <p className="text-sm font-semibold text-silver-light">Enable Notification Popup</p>
              <p className="text-xs text-silver-muted mt-0.5">
                When enabled, users will see this message as a popup on their dashboard.
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
              Notification Message
            </label>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Enter the notification message to show users..."
              rows={6}
              className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-sm text-silver-light placeholder:text-silver-muted/40 focus:border-primary-glow/50 focus:outline-none transition-all resize-none"
            />
            <p className="text-xs text-silver-muted">
              Supports line breaks. Leave empty to show no message even if popup is enabled.
            </p>
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
              <span>Save Notification Settings</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
