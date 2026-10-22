import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio, AlertTriangle, ShieldAlert, Navigation, Share2,
  CheckCircle2, MapPin, Clock, Compass, Waves, ChevronDown, ChevronUp, Bell, Copy, Check
} from 'lucide-react'
import {
  getAllAdvisories,
  subscribeToAdvisories,
  type AuthorityAdvisory
} from '../services/incidentAndReliefService'
import { useToast } from '../context/ToastContext'
import { playAlertSound, playClickSound, playSuccessSound } from '../utils/audioFeedback'

interface PublicAdvisoryBroadcastBannerProps {
  maxVisible?: number
  showAlways?: boolean
}

export default function PublicAdvisoryBroadcastBanner({ maxVisible = 3 }: PublicAdvisoryBroadcastBannerProps) {
  const toast = useToast()
  const [advisories, setAdvisories] = useState<AuthorityAdvisory[]>([])
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const refresh = () => {
    const list = getAllAdvisories()
    setAdvisories(list)
  }

  useEffect(() => {
    refresh()
    const unsubscribe = subscribeToAdvisories(refresh)
    return () => unsubscribe()
  }, [])

  // Load local acknowledged advisories
  useEffect(() => {
    try {
      const raw = localStorage.getItem('safeground_acknowledged_advisories')
      if (raw) setAcknowledgedIds(JSON.parse(raw))
    } catch {}
  }, [])

  if (advisories.length === 0) {
    return null
  }

  const handleAcknowledge = (id: string) => {
    playSuccessSound()
    const updated = Array.from(new Set([...acknowledgedIds, id]))
    setAcknowledgedIds(updated)
    try {
      localStorage.setItem('safeground_acknowledged_advisories', JSON.stringify(updated))
    } catch {}
    toast.success('Advisory Acknowledged', `Notice #${id} acknowledged and logged in personal safety profile.`)
  }

  const handleShare = (adv: AuthorityAdvisory) => {
    playClickSound()
    const text = `🚨 [OFFICIAL SAFEGROUND BENGALURU ADVISORY]\nToken: ${adv.id}\n${adv.title}\nZone: ${adv.zone} | Severity: ${adv.severity}\nReported Water Depth: ${adv.waterDepthReported}\n\nDIRECTIVE:\n${adv.message}\n\n🛣️ MANDATORY SAFER ROUTE:\n${adv.saferAlternativeRoute}\n\nIssued by: ${adv.authorityName}\nLive Emergency Grid: https://safeground-bengaluru.vercel.app`
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedId(adv.id)
      setTimeout(() => setCopiedId(null), 2500)
      toast.success('Directive Copied to Clipboard', 'Share this official emergency bypass route with family and neighbors.')
    }
  }

  const unacknowledgedCount = advisories.filter(a => !acknowledgedIds.includes(a.id)).length
  const primaryAdvisory = advisories[0]
  const isCritical = advisories.some(a => a.severity === 'CRITICAL')

  return (
    <motion.aside
      aria-label="Official Public Disaster Advisories"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        marginBottom: 20,
        borderRadius: 16,
        background: isCritical
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.08) 100%)',
        border: `1.5px solid ${isCritical ? 'rgba(239, 68, 68, 0.55)' : 'rgba(245, 158, 11, 0.5)'}`,
        boxShadow: isCritical
          ? '0 8px 30px rgba(239, 68, 68, 0.22), 0 0 15px rgba(239, 68, 68, 0.15)'
          : '0 8px 30px rgba(245, 158, 11, 0.2), 0 0 15px rgba(245, 158, 11, 0.12)',
        overflow: 'hidden',
      }}
    >
      {/* ─── Top Broadcast Header ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
          borderBottom: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isCritical ? '#EF4444' : '#F59E0B',
              boxShadow: isCritical ? '0 0 12px #EF4444' : '0 0 12px #F59E0B',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          />
          <Radio size={16} color={isCritical ? '#FCA5A5' : '#FDE68A'} />
          <span style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: '0.05em', color: '#FFFFFF', textTransform: 'uppercase' }}>
            Official Disaster Authority Public Broadcast
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              background: '#000000',
              color: isCritical ? '#F87171' : '#FBBF24',
              border: `1px solid ${isCritical ? '#EF4444' : '#F59E0B'}`,
            }}
          >
            {advisories.length} ACTIVE DIRECTIVE{advisories.length > 1 ? 'S' : ''}
          </span>
          {unacknowledgedCount > 0 && (
            <span style={{ fontSize: 11, color: '#FCD34D', fontWeight: 700 }}>
              ({unacknowledgedCount} unacknowledged)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            KSNDMC & BBMP Disaster Command Telemetry
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {collapsed ? (
              <><span>Expand</span> <ChevronDown size={13} /></>
            ) : (
              <><span>Collapse</span> <ChevronUp size={13} /></>
            )}
          </button>
        </div>
      </div>

      {/* ─── Body: Advisories Stream ─── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {advisories.slice(0, maxVisible).map((adv) => {
              const isAck = acknowledgedIds.includes(adv.id)
              const isCopied = copiedId === adv.id

              return (
                <div
                  key={adv.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 14,
                    padding: '16px 18px',
                    position: 'relative',
                  }}
                >
                  {/* Top line with tokens and tags */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 900,
                          background: adv.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                          color: adv.severity === 'CRITICAL' ? '#F87171' : '#FBBF24',
                          border: `1px solid ${adv.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'}`,
                        }}
                      >
                        {adv.severity} ADVISORY
                      </span>

                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#34D399', fontFamily: 'monospace' }}>
                        Token: {adv.id}
                      </span>

                      <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>•</span>

                      <span style={{ fontSize: 11.5, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="#38BDF8" /> {adv.zone} Zone
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {new Date(adv.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(adv.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Headline */}
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.4 }}>
                    {adv.title}
                  </h3>

                  {/* Depth & Hazard Callout */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    marginBottom: 10,
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#FCA5A5' }}>
                      <Waves size={15} color="#EF4444" />
                      Reported Waterlogging Depth: <b style={{ color: '#FFFFFF', fontSize: 13 }}>{adv.waterDepthReported}</b>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)' }}>
                      Inundation alert verified by municipal field sensors & citizen logs
                    </div>
                  </div>

                  {/* Main Message */}
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6 }}>
                    {adv.message}
                  </p>

                  {/* Mandatory Safer Alternative Route */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
                      border: '1.5px solid #10B981',
                      borderRadius: 10,
                      padding: '12px 14px',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 900, color: '#34D399', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
                      <Navigation size={14} color="#34D399" />
                      Designated Safer Evacuation & Bypass Route
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                      {adv.saferAlternativeRoute}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                      ⚠️ Avoid all low-lying underpasses and stormwater drain embankments in this sector. Follow elevated bypass routes and BBMP Traffic Police instructions.
                    </div>
                  </div>

                  {/* Footer & Authority Signature */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--tx-muted)' }}>
                      Authorized & Dispatched by: <b style={{ color: '#FFFFFF' }}>{adv.authorityName}</b>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => handleShare(adv)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 13px',
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          color: '#FFFFFF',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isCopied ? <Check size={13} color="#34D399" /> : <Share2 size={13} />}
                        <span>{isCopied ? 'Directive Copied' : 'Share Advisory'}</span>
                      </button>

                      <button
                        onClick={() => handleAcknowledge(adv.id)}
                        disabled={isAck}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 13px',
                          borderRadius: 8,
                          background: isAck ? 'rgba(16, 185, 129, 0.15)' : '#10B981',
                          border: isAck ? '1px solid #10B981' : 'none',
                          color: isAck ? '#34D399' : '#030604',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: isAck ? 'default' : 'pointer',
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isAck ? 'Acknowledged' : 'Acknowledge Notice'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
