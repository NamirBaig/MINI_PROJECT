import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, Copy, X } from 'lucide-react'
import { playSuccessSound, playAlertSound, playClickSound } from '../utils/audioFeedback'

export type ToastType = 'success' | 'alert' | 'info' | 'copy'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  subtext?: string
}

interface ToastContextType {
  showToast: (title: string, type?: ToastType, subtext?: string) => void
  success: (title: string, subtext?: string) => void
  alert: (title: string, subtext?: string) => void
  info: (title: string, subtext?: string) => void
  copy: (text: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      showToast: () => {},
      success: () => {},
      alert: () => {},
      info: () => {},
      copy: () => {},
    }
  }
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((title: string, type: ToastType = 'info', subtext?: string) => {
    const id = 'toast-' + Math.random().toString(36).substr(2, 9)
    if (type === 'success' || type === 'copy') {
      playSuccessSound()
    } else if (type === 'alert') {
      playAlertSound()
    } else {
      playClickSound()
    }

    setToasts(prev => [...prev.slice(-3), { id, type, title, subtext }])

    setTimeout(() => {
      removeToast(id)
    }, 3800)
  }, [removeToast])

  const success = useCallback((title: string, subtext?: string) => showToast(title, 'success', subtext), [showToast])
  const alert = useCallback((title: string, subtext?: string) => showToast(title, 'alert', subtext), [showToast])
  const info = useCallback((title: string, subtext?: string) => showToast(title, 'info', subtext), [showToast])
  const copy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    showToast(`Copied to Clipboard`, 'copy', text)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, alert, info, copy }}>
      {children}
      {/* Floating HUD Toast Portal */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
          maxWidth: '420px',
          width: 'calc(100vw - 48px)',
        }}
      >
        <AnimatePresence>
          {toasts.map(toast => {
            const isSuccess = toast.type === 'success' || toast.type === 'copy'
            const isAlert = toast.type === 'alert'
            const borderColor = isSuccess ? 'rgba(16, 185, 129, 0.45)' : isAlert ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.45)'
            const glowColor = isSuccess ? 'rgba(16, 185, 129, 0.2)' : isAlert ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.2)'
            const iconColor = isSuccess ? '#34D399' : isAlert ? '#EF4444' : '#60A5FA'

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                style={{
                  pointerEvents: 'auto',
                  background: 'linear-gradient(135deg, rgba(12, 21, 16, 0.95) 0%, rgba(6, 11, 8, 0.98) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${borderColor}`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  boxShadow: `0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px ${glowColor}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  color: '#FFFFFF',
                }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  {toast.type === 'copy' ? (
                    <Copy size={18} color={iconColor} />
                  ) : isSuccess ? (
                    <CheckCircle2 size={18} color={iconColor} />
                  ) : isAlert ? (
                    <AlertTriangle size={18} color={iconColor} />
                  ) : (
                    <Info size={18} color={iconColor} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
                    {toast.title}
                  </div>
                  {toast.subtext && (
                    <div style={{
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.65)',
                      marginTop: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {toast.subtext}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 2,
                    cursor: 'pointer',
                    color: 'rgba(255, 255, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
