'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'
import api from '@/lib/api'

export default function NotificationModal() {
  const auth = useContext(AuthContext)
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!auth?.isAuthenticated) return

    const fetchNotification = async () => {
      try {
        const response = await api.get('/services/notification')
        const data = response.data?.data
        if (data?.notificationEnabled && data?.notificationMessage) {
          const dismissedMsg = sessionStorage.getItem('dismissed_notification_msg')
          if (dismissedMsg !== data.notificationMessage) {
            setMessage(data.notificationMessage)
            setIsOpen(true)
          }
        }
      } catch (err) {
        console.error('Error fetching popup notification:', err)
      }
    }

    fetchNotification()
  }, [auth?.isAuthenticated])

  const handleDismiss = () => {
    sessionStorage.setItem('dismissed_notification_msg', message)
    setIsOpen(false)
  }

  if (!isOpen || !message) return null

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-dark-bg-secondary border border-primary-glow/30 p-6 md:p-8 rounded-2xl max-w-lg w-full glass-dark shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-glow/10 border border-primary-glow/30 rounded-xl shrink-0">
            <svg className="w-6 h-6 text-primary-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">Notice & Announcement</h3>
            <p className="text-xs text-silver-muted mt-0.5">Important update from AB Data Hub Admin</p>
          </div>
        </div>

        <div className="bg-dark-bg/60 border border-silver-muted/10 p-4 rounded-xl max-h-[250px] overflow-y-auto">
          <p className="text-sm text-silver-light whitespace-pre-line leading-relaxed">{message}</p>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all text-sm flex items-center justify-center gap-2"
        >
          <span>Understood / Close</span>
        </button>
      </div>
    </div>
  )
}
