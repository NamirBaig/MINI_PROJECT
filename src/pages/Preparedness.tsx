import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare, ShieldCheck, AlertCircle, Phone, ExternalLink,
  Plus, Download, Sparkles, CheckCircle2, Copy, X, ListFilter,
  Building, Home, Car, CloudRain, RefreshCw, Zap, ShieldAlert
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import type { WeatherData } from '../hooks/useWeather'

export interface TaskItem {
  id: string
  task: string
  category: string
  priority: 'High' | 'Medium' | 'Low'
  estimate: string
  completed: boolean
  isLiveWeather?: boolean
}

interface PreparednessProps {
  weatherData?: WeatherData
}

// ─── 4 Pre-filled Profiles ──────────────────────────────────────────
export const PREFILLED_PROFILES: Record<string, { title: string; subtitle: string; icon: any; tasks: TaskItem[] }> = {
  apartment: {
    title: 'Apartment Resident',
    subtitle: 'Tailored for high-rises, basements & gated societies (Yelahanka, Bellandur, ORR)',
    icon: Building,
    tasks: [
      { id: 'apt-1', task: 'Pack a 72-hour family go-bag (torches, battery bank, whistle, first-aid)', category: 'Emergency Kit', priority: 'High', estimate: '30 min', completed: true },
      { id: 'apt-2', task: 'Move parked car from basement to upper podium during rain alerts', category: 'Evacuation', priority: 'High', estimate: '10 min', completed: false },
      { id: 'apt-3', task: 'Store 15 Litres drinking water (apartments lose water pumps in blackouts)', category: 'Food & Water', priority: 'High', estimate: '20 min', completed: false },
      { id: 'apt-4', task: 'Pack 7-day vital prescription medicines in a waterproof ziplock pouch', category: 'Medical', priority: 'High', estimate: '15 min', completed: true },
      { id: 'apt-5', task: 'Verify building association generator fuel & dewatering pumps operational', category: 'Home Safety', priority: 'High', estimate: '15 min', completed: false },
      { id: 'apt-6', task: 'Keep high-capacity 20,000mAh phone power banks at 100% charge', category: 'Power', priority: 'Medium', estimate: '10 min', completed: true },
      { id: 'apt-7', task: 'Save facility manager and BBMP Disaster Cell (1533) in phone contacts', category: 'Communication', priority: 'High', estimate: '5 min', completed: true },
      { id: 'apt-8', task: 'Identify dry pedestrian exit stairways avoiding flooded basement ramps', category: 'Evacuation', priority: 'Medium', estimate: '10 min', completed: false },
    ],
  },
  independent: {
    title: 'Ground Floor / Villa',
    subtitle: 'Tailored for individual houses vulnerable to street water ingress (Koramangala, HSR)',
    icon: Home,
    tasks: [
      { id: 'ind-1', task: 'Install sandbags or temporary flood boards across entry gates', category: 'Home Safety', priority: 'High', estimate: '45 min', completed: false },
      { id: 'ind-2', task: 'Elevate ground floor electronics (fridge, washing machine, inverter) on blocks', category: 'Home Safety', priority: 'High', estimate: '30 min', completed: true },
      { id: 'ind-3', task: 'Inspect terrace stormwater drain pipe and street gutter for plastic blockages', category: 'Home Safety', priority: 'High', estimate: '20 min', completed: false },
      { id: 'ind-4', task: 'Shut off main electrical breaker if street flood water enters front porch', category: 'Power', priority: 'High', estimate: '5 min', completed: false },
      { id: 'ind-5', task: 'Store 3-day non-perishable food and portable stove on first floor', category: 'Food & Water', priority: 'High', estimate: '30 min', completed: false },
      { id: 'ind-6', task: 'Move vehicles to elevated road or parking garage nearby before heavy rain', category: 'Evacuation', priority: 'High', estimate: '15 min', completed: true },
      { id: 'ind-7', task: 'Seal property documents, Aadhaar, and passports in waterproof container on 1st floor', category: 'Documents', priority: 'Medium', estimate: '25 min', completed: true },
      { id: 'ind-8', task: 'Keep gumboots, raincoats, and emergency battery lanterns ready', category: 'Emergency Kit', priority: 'Medium', estimate: '10 min', completed: false },
    ],
  },
  commuter: {
    title: 'Daily Commuter',
    subtitle: 'Tailored for tech corridor travelers navigating underpasses (Silk Board, Marathahalli)',
    icon: Car,
    tasks: [
      { id: 'com-1', task: 'Check live underpass flood radar before leaving office or home', category: 'Commute', priority: 'High', estimate: '5 min', completed: true },
      { id: 'com-2', task: 'Download offline navigation maps for elevated flyover routes avoiding underpasses', category: 'Commute', priority: 'High', estimate: '10 min', completed: false },
      { id: 'com-3', task: 'Keep car emergency window breaker and seatbelt cutter inside glove box', category: 'Emergency Kit', priority: 'High', estimate: '5 min', completed: true },
      { id: 'com-4', task: 'Never drive into standing water deeper than 20cm (wheel center)', category: 'Safety Rules', priority: 'High', estimate: '5 min', completed: true },
      { id: 'com-5', task: 'Carry waterproof rain cover sleeve for laptop and office bag', category: 'Documents', priority: 'Medium', estimate: '5 min', completed: false },
      { id: 'com-6', task: 'Keep emergency change of dry clothes and waterproof footwear in car boot', category: 'Emergency Kit', priority: 'Medium', estimate: '15 min', completed: false },
      { id: 'com-7', task: 'Save Karnataka breakdown towing helpline and SDRF 1070 in phone directory', category: 'Communication', priority: 'High', estimate: '5 min', completed: true },
    ],
  },
}

export default function Preparedness({ weatherData }: PreparednessProps) {
  const { user, currentRole } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    if (currentRole !== 'citizen') {
      navigate('/dashboard', { replace: true })
    }
  }, [currentRole, navigate])

  const [activeProfile, setActiveProfile] = useState<string>('apartment')
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('safeground_tasks')
    return saved ? JSON.parse(saved) : PREFILLED_PROFILES.apartment.tasks
  })
  const [selectedCat, setSelectedCat] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('Emergency Kit')
  const [liveWeatherSynced, setLiveWeatherSynced] = useState(false)

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('safeground_tasks', JSON.stringify(tasks))
  }, [tasks])

  // Select a pre-filled profile
  const handleSelectProfile = (profileKey: string) => {
    playSuccessSound()
    setActiveProfile(profileKey)
    const preset = PREFILLED_PROFILES[profileKey]
    if (preset) {
      setTasks(preset.tasks)
      setLiveWeatherSynced(false)
      toast.success(`Loaded Preset: ${preset.title}`, 'Checklist pre-filled with recommended actions')
    }
  }

  // Check Preparedness for Live Data
  const handleCheckLiveData = () => {
    playSuccessSound()
    setLiveWeatherSynced(true)
    const currentRain = weatherData?.rainfall24h ?? 24
    const isHeavyRain = currentRain >= 30

    const liveTasks: TaskItem[] = [
      {
        id: 'live-1',
        task: `[LIVE WEATHER: ${currentRain}mm] Verify basement dewatering pump and generator fuel`,
        category: 'Power',
        priority: 'High',
        estimate: '10 min',
        completed: false,
        isLiveWeather: true,
      },
      {
        id: 'live-2',
        task: `[LIVE WEATHER] Move parked vehicles away from Silk Board / low-lying underpasses`,
        category: 'Evacuation',
        priority: 'High',
        estimate: '15 min',
        completed: false,
        isLiveWeather: true,
      },
      {
        id: 'live-3',
        task: `[LIVE WEATHER] Charge mobile phones, power banks & keep emergency torches accessible`,
        category: 'Power',
        priority: 'High',
        estimate: '10 min',
        completed: true,
        isLiveWeather: true,
      },
      ...tasks.filter(t => !t.isLiveWeather)
    ]

    setTasks(liveTasks)
    toast.success('Live Weather Synced', `Adjusted checklist for today's ${currentRain}mm rainfall`)
  }

  const toggleTask = (id: string) => {
    const target = tasks.find(t => t.id === id)
    const nextCompleted = !target?.completed

    if (nextCompleted) {
      playSuccessSound()
      toast.success('Task Completed!', target?.task.slice(0, 35) + '...')
    } else {
      playClickSound()
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: nextCompleted } : t))
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    playSuccessSound()

    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      task: newTaskTitle.trim(),
      category: newTaskCategory,
      priority: 'High',
      estimate: '15 min',
      completed: false,
    }

    setTasks(prev => [newTask, ...prev])
    setNewTaskTitle('')
    setIsModalOpen(false)
    toast.success('Task Added to Preparedness Plan')
  }

  const handleExportPlan = () => {
    playClickSound()
    const content = `SAFEGROUND BENGALURU - FAMILY DISASTER PREPAREDNESS PLAN\nGenerated: ${new Date().toLocaleDateString()}\nStatus: ${completedCount}/${tasks.length} tasks ready (${progressPct}%)\n\nTASKS:\n` +
      tasks.map(t => `[${t.completed ? 'X' : ' '}] ${t.task} (${t.category} - ${t.estimate})`).join('\n') +
      `\n\nEMERGENCY HELPLINES:\nBBMP Disaster Cell: 080-22221188 / 1533\nEmergency Police/Fire/Ambulance: 112\nKarnataka SDRF: 1070\nKSNDMC Flood Helpline: 1800-425-1188`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'SafeGround_Preparedness_Plan.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded Preparedness Plan')
  }

  const completedCount = tasks.filter(t => t.completed).length
  const progressPct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0

  const categories = ['All', ...Array.from(new Set(tasks.map(t => t.category)))]
  const filteredTasks = selectedCat === 'All' ? tasks : tasks.filter(t => t.category === selectedCat)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1100, margin: '0 auto' }}>
      {/* ─── Top Header Banner ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 11, 8, 0.8) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 18,
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34D399',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
            }}>
              <CheckSquare size={13} /> CITIZEN READINESS
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Bengaluru Family Go-Bag & Evacuation Plan
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
            Disaster Preparedness
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255, 255, 255, 0.75)', maxWidth: 640 }}>
            Choose a pre-filled plan or check your readiness for current live weather in Bengaluru.
          </p>
        </div>

        {/* Action Buttons: Add Task & Export */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              playClickSound()
              setIsModalOpen(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: '#FFFFFF',
              padding: '9px 15px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Add Custom Task
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExportPlan}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              color: '#030604',
              padding: '9px 15px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Download size={15} /> Export Plan
          </motion.button>
        </div>
      </div>

      {/* ─── Pre-Filled Options & Live Data Selector ─────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pri-neon)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Select Pre-Filled Profile or Live Weather Sync:
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 12,
        }}>
          {/* Preset 1: Apartment */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectProfile('apartment')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 12,
              background: activeProfile === 'apartment' && !liveWeatherSynced ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: activeProfile === 'apartment' && !liveWeatherSynced ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34D399',
              flexShrink: 0,
            }}>
              <Building size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: activeProfile === 'apartment' && !liveWeatherSynced ? '#34D399' : '#FFFFFF' }}>
                Apartment Resident
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>
                Basements, lifts & power
              </div>
            </div>
          </motion.button>

          {/* Preset 2: Independent House */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectProfile('independent')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 12,
              background: activeProfile === 'independent' && !liveWeatherSynced ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: activeProfile === 'independent' && !liveWeatherSynced ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA',
              flexShrink: 0,
            }}>
              <Home size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: activeProfile === 'independent' && !liveWeatherSynced ? '#60A5FA' : '#FFFFFF' }}>
                Ground Floor Home
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>
                Sandbags, drains & elevation
              </div>
            </div>
          </motion.button>

          {/* Preset 3: Commuter */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectProfile('commuter')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 12,
              background: activeProfile === 'commuter' && !liveWeatherSynced ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: activeProfile === 'commuter' && !liveWeatherSynced ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FBBF24',
              flexShrink: 0,
            }}>
              <Car size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: activeProfile === 'commuter' && !liveWeatherSynced ? '#FBBF24' : '#FFFFFF' }}>
                Daily Commuter
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>
                Underpasses & car safety
              </div>
            </div>
          </motion.button>

          {/* Option 4: Check Live Weather Data */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckLiveData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 12,
              background: liveWeatherSynced ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)' : 'rgba(255, 255, 255, 0.04)',
              border: liveWeatherSynced ? '1px solid #34D399' : '1px solid rgba(16, 185, 129, 0.4)',
              color: '#FFFFFF',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: liveWeatherSynced ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none',
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#030604',
              flexShrink: 0,
            }}>
              <CloudRain size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#34D399', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>Sync Live Weather</span>
                <Sparkles size={13} color="#FBBF24" />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                Current: {weatherData?.rainfall24h ?? 24}mm rain today
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* ─── Live Weather Sync Banner (if active) ─────────────── */}
      {liveWeatherSynced && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 14,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CloudRain size={20} color="#34D399" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>
                Active Live Weather Sync: {weatherData?.rainfall24h ?? 24} mm Recorded in Bengaluru
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                3 high-urgency tasks highlighted at the top of your list based on real-time monsoon conditions.
              </div>
            </div>
          </div>

          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34D399',
          }}>
            LIVE RAINFALL ACTIVE
          </span>
        </div>
      )}

      {/* ─── Progress & Stats Bar ─────────────────────────────── */}
      <div className="bento-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--pri-neon)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Readiness Score
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
              {completedCount} of {tasks.length} Items Ready ({progressPct}%)
            </div>
          </div>

          <span style={{
            padding: '5px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            color: progressPct >= 75 ? '#34D399' : progressPct >= 50 ? '#FBBF24' : '#EF4444',
            background: progressPct >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${progressPct >= 75 ? '#10B98150' : '#F59E0B50'}`,
          }}>
            {progressPct >= 75 ? 'Well Prepared' : progressPct >= 50 ? 'Moderate Readiness' : 'Needs Immediate Attention'}
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
              borderRadius: 5,
            }}
          />
        </div>
      </div>

      {/* ─── Category Filter Pills ────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              playClickSound()
              setSelectedCat(cat)
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: selectedCat === cat ? '1px solid var(--pri)' : '1px solid rgba(255,255,255,0.08)',
              background: selectedCat === cat ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
              color: selectedCat === cat ? '#34D399' : 'rgba(255,255,255,0.65)',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── Task List ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredTasks.map(t => {
          return (
            <motion.div
              key={t.id}
              whileHover={{ x: 3 }}
              onClick={() => toggleTask(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 12,
                background: t.completed
                  ? 'rgba(16, 185, 129, 0.08)'
                  : t.isLiveWeather
                  ? 'rgba(6, 182, 212, 0.08)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: t.completed
                  ? '1px solid rgba(16, 185, 129, 0.25)'
                  : t.isLiveWeather
                  ? '1px solid rgba(6, 182, 212, 0.35)'
                  : '1px solid rgba(255, 255, 255, 0.07)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Custom Checkbox */}
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: t.completed ? '2px solid #10B981' : '2px solid rgba(255,255,255,0.3)',
                  background: t.completed ? '#10B981' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}>
                  {t.completed && <CheckCircle2 size={14} color="#030604" strokeWidth={3} />}
                </div>

                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: t.completed ? 'rgba(255,255,255,0.45)' : '#FFFFFF',
                    textDecoration: t.completed ? 'line-through' : 'none',
                    lineHeight: 1.4,
                  }}>
                    {t.task}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{t.category}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ fontSize: 11, color: 'var(--tx-dim)' }}>Est: {t.estimate}</span>
                  </div>
                </div>
              </div>

              {/* Priority or Live Badge */}
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                color: t.isLiveWeather ? '#67E8F9' : t.priority === 'High' ? '#EF4444' : '#F59E0B',
                background: t.isLiveWeather ? 'rgba(6, 182, 212, 0.15)' : t.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              }}>
                {t.isLiveWeather ? 'LIVE SYNC' : t.priority}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* ─── Add Task Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'linear-gradient(145deg, #0C1A14 0%, #06100B 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 16,
                width: '100%',
                maxWidth: 480,
                padding: 24,
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>Add Custom Preparedness Task</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 6 }}>
                    Task Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Check terrace drain filter for leaves"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--tx-muted)', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: '#0c1510',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: 13,
                    }}
                  >
                    <option value="Emergency Kit">Emergency Kit</option>
                    <option value="Home Safety">Home Safety</option>
                    <option value="Evacuation">Evacuation</option>
                    <option value="Food & Water">Food & Water</option>
                    <option value="Medical">Medical</option>
                    <option value="Power">Power & Electricity</option>
                    <option value="Documents">Documents</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '9px 20px',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      border: 'none',
                      color: '#030604',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
