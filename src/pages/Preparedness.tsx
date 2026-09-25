import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, ShieldCheck, AlertCircle, Phone, ExternalLink } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface TaskItem {
  id: string
  task: string
  category: string
  priority: string
  estimate: string
  completed: boolean
}

const DEFAULT_TASKS: TaskItem[] = [
  { id: '1', task: 'Pack a 72-hour emergency go-bag (flashlight, batteries, power bank)', category: 'Emergency Kit', priority: 'High', estimate: '30 min', completed: true },
  { id: '2', task: 'Mark 2 dry evacuation routes avoiding Bellandur & Koramangala underpasses', category: 'Evacuation', priority: 'High', estimate: '20 min', completed: false },
  { id: '3', task: 'Store 3 Litres drinking water per family member per day (minimum 3-day supply)', category: 'Food & Water', priority: 'High', estimate: '45 min', completed: false },
  { id: '4', task: 'Save BBMP Disaster Control (080-22221188) and 112 offline in phone', category: 'Communication', priority: 'High', estimate: '5 min', completed: true },
  { id: '5', task: 'Pack 7-day supply of vital prescription medications in waterproof pouch', category: 'Medical', priority: 'High', estimate: '15 min', completed: false },
  { id: '6', task: 'Digitize Aadhaar, property, and vehicle insurance cards to offline drive', category: 'Documents', priority: 'Medium', estimate: '25 min', completed: true },
  { id: '7', task: 'Keep inverter and power banks at 100% before monsoon weather alerts', category: 'Power', priority: 'Medium', estimate: '10 min', completed: false },
  { id: '8', task: 'Inspect rooftop drainage and terrace gutters for debris before heavy rain', category: 'Home Safety', priority: 'Medium', estimate: '20 min', completed: false },
]

export default function Preparedness() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS)
  const [syncStatus, setSyncStatus] = useState<string>('')

  // Load from Supabase or localStorage
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('safeground_tasks')
      if (saved) {
        try {
          setTasks(JSON.parse(saved))
        } catch (e) {}
      }
      return
    }

    const loadTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('user_id', user.id)

        if (data && data.length > 0) {
          setTasks(data.map((d: any) => ({
            id: d.id,
            task: d.task,
            category: d.category || 'General',
            priority: d.priority || 'Medium',
            estimate: d.estimate || '15 min',
            completed: d.completed,
          })))
        }
      } catch (err) {
        console.warn('Failed to load tasks from Supabase', err)
      }
    }

    loadTasks()
  }, [user])

  const toggleTask = async (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    setTasks(updated)

    if (!user) {
      localStorage.setItem('safeground_tasks', JSON.stringify(updated))
      return
    }

    // Update in Supabase
    const target = updated.find(t => t.id === id)
    if (target) {
      setSyncStatus('Saving to Supabase...')
      try {
        await supabase
          .from('checklist_items')
          .upsert({
            user_id: user.id,
            task: target.task,
            category: target.category,
            priority: target.priority,
            estimate: target.estimate,
            completed: target.completed,
            updated_at: new Date().toISOString(),
          })
        setSyncStatus('Saved')
        setTimeout(() => setSyncStatus(''), 2000)
      } catch (err) {
        setSyncStatus('Offline saved')
      }
    }
  }

  const completedCount = tasks.filter(t => t.completed).length
  const progressPct = Math.round((completedCount / tasks.length) * 100)

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Personal Preparedness Checklist</h1>
          <p className="sub" style={{ margin: 0 }}>
            Curated emergency readiness actions tailored for Bengaluru urban flooding & disruption.
          </p>
        </div>
        {user ? (
          <span style={{ fontSize: 12, color: 'var(--low)', background: 'var(--low-bg)', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
            {syncStatus || '✓ Synced with Supabase'}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--warn)', background: 'var(--warn-bg)', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
            Local session (Sign in to sync cloud)
          </span>
        )}
      </div>

      {/* Progress Card */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} color="var(--pri)" />
            <span style={{ fontWeight: 600 }}>Overall Readiness Score</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: progressPct >= 75 ? 'var(--low)' : 'var(--warn)' }}>
            {progressPct}%
          </span>
        </div>
        <div className="bar" style={{ height: 12 }}>
          <motion.div
            className="bar-fill"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
            style={{ background: progressPct >= 75 ? 'var(--low)' : 'var(--pri)' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--tx-muted)', marginTop: 8 }}>
          <span>{completedCount} of {tasks.length} tasks ready</span>
          <span>{progressPct >= 75 ? 'High preparedness level' : 'Action items pending'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
        {/* Checklist */}
        <div className="card">
          <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>Action Items</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.map(t => (
              <motion.div
                key={t.id}
                whileHover={{ x: 2 }}
                onClick={() => toggleTask(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  background: t.completed ? 'var(--surf2)' : 'var(--bg)',
                  border: '1px solid var(--ln)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => {}} // Handled by parent div
                  style={{ marginTop: 3, accentColor: 'var(--pri)', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    color: t.completed ? 'var(--tx-muted)' : 'var(--tx)',
                    textDecoration: t.completed ? 'line-through' : 'none',
                    lineHeight: 1.4,
                  }}>
                    {t.task}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11 }}>
                    <span style={{ background: 'var(--surf)', padding: '1px 6px', borderRadius: 4, color: 'var(--tx-muted)' }}>
                      {t.category}
                    </span>
                    <span style={{ color: t.priority === 'High' ? 'var(--dan)' : 'var(--tx-muted)', fontWeight: 600 }}>
                      {t.priority}
                    </span>
                    <span style={{ color: 'var(--tx-muted)' }}>⏱ {t.estimate}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Emergency Resources */}
        <div className="card">
          <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>Bengaluru Emergency Contacts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'BBMP Disaster Helpline', num: '080-22221188 / 1533' },
              { label: 'Karnataka SDRF Control Room', num: '1070' },
              { label: 'KSNDMC Flood & Rain Updates', num: '1800-425-1188' },
              { label: 'State Emergency Response (Police/Fire)', num: '112' },
              { label: 'BWSSB Water Contamination Helpline', num: '1916' },
              { label: 'BESCOM Power Hazard Line', num: '1912' },
            ].map(c => (
              <div
                key={c.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--ln)',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{c.label}</div>
                  <div style={{ color: 'var(--pri)', fontWeight: 700, marginTop: 2 }}>{c.num}</div>
                </div>
                <Phone size={14} color="var(--pri)" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
