import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, MapPin, AlertCircle, PhoneCall, ShieldAlert,
  Copy, CheckCircle2, Truck, Waves, Send, X, PlusCircle, Compass, Crosshair,
  Bed, Droplets, HeartPulse, Activity, ShieldCheck, ArrowRight, RefreshCw, LifeBuoy
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BENGALURU_ZONES } from '../data/bengaluru'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/audioFeedback'
import RequirementMap from '../components/RequirementMap'
import { getAllRequests, subscribeToRequests, type EmergencyRequest } from '../services/requestService'

const EMERGENCY_CONTACTS = [
  { name: 'BBMP Disaster Control Room', phone: '080-22221188', tollFree: '1533', desc: 'Central stormwater, dewatering pumps & fallen trees' },
  { name: 'Unified State Emergency', phone: '112', tollFree: '112', desc: 'Police, Fire and Immediate Life Hazard Rescue' },
  { name: 'Karnataka SDRF Headquarters', phone: '080-22340675', tollFree: '1070', desc: 'State Disaster Response Force motorized boats & divers' },
  { name: 'KSNDMC Varuna Mitra', phone: '080-22340676', tollFree: '1800-425-1188', desc: 'State Natural Disaster Monitoring real-time rain alerts' },
  { name: 'Karnataka 108 Emergency Ambulance', phone: '108', tollFree: '108', desc: 'Medical emergency airlift & trauma response' },
  { name: 'BESCOM Electrical Helpline', phone: '1912', tollFree: '1912', desc: 'Substation shutoff & transformer submersion risks' },
]

// Baseline Bengaluru Contingency Capacities
const BASE_CAPACITIES = [
  {
    id: 'icu_beds',
    type: 'Hospital ICU Beds (Critical Care)',
    category: 'beds',
    icon: HeartPulse,
    color: '#EF4444',
    totalQuota: 120,
    unit: 'Beds',
    location: 'Bowring, Victoria Trauma, Manipal, Columbia Asia',
    desc: 'Equipped with dedicated invasive ventilators, multi-para monitors & trauma doctors',
  },
  {
    id: 'general_beds',
    type: 'Hospital General Inpatient Beds',
    category: 'beds',
    icon: Bed,
    color: '#3B82F6',
    totalQuota: 850,
    unit: 'Beds',
    location: 'BBMP Referral Hospitals, KC General, Yelahanka GH',
    desc: 'Medical flood triage and non-critical inpatient observation beds',
  },
  {
    id: 'water_tankers',
    type: 'BWSSB Potable Water Tankers (6,000L)',
    category: 'water',
    icon: Droplets,
    color: '#06B6D4',
    totalQuota: 65,
    unit: 'Tankers',
    location: 'BWSSB Central Water Depots (4 Zones)',
    desc: 'Chlorinated, laboratory-tested drinking water dispatched to contaminated areas',
  },
  {
    id: 'rescue_boats',
    type: 'SDRF / NDRF Evacuation Rescue Boats',
    category: 'rescue',
    icon: LifeBuoy,
    color: '#10B981',
    totalQuota: 28,
    unit: 'Crafts',
    location: 'BBMP Central Storehouses & Yelahanka Air Base',
    desc: 'Motorized inflatable craft with certified divers and infant rescue cages',
  },
  {
    id: 'oxygen_kits',
    type: 'Oxygen Concentrators & Trauma Kits',
    category: 'medical',
    icon: Activity,
    color: '#F59E0B',
    totalQuota: 180,
    unit: 'Kits',
    location: 'KSSDMA State Warehouses & District Hospitals',
    desc: 'Portable battery-backup oxygen generators and field trauma dressings',
  },
  {
    id: 'food_rations',
    type: 'Emergency Dry Rations & Relief Packs',
    category: 'food',
    icon: Truck,
    color: '#A855F7',
    totalQuota: 3500,
    unit: 'Bundles',
    location: 'Food & Civil Supplies Department (BBMP Depots)',
    desc: '72-hour family food packets (ready-to-eat meals, infant milk powder, ORS)',
  },
  {
    id: 'dewatering_pumps',
    type: 'High-Flow Dewatering Diesel Pumps (500 GPM)',
    category: 'rescue',
    icon: Waves,
    color: '#60A5FA',
    totalQuota: 42,
    unit: 'Units',
    location: 'Silk Board, Hebbal, Marathahalli & EcoSpace Outlets',
    desc: 'Heavy industrial trailer pumps for clearing flooded underpasses & basements',
  },
]

export default function Resources() {
  const { currentRole } = useAuth()
  const toast = useToast()
  const isCitizen = currentRole === 'citizen'

  // Authority tab toggle
  const [activeTab, setActiveTab] = useState<'requirement_map' | 'inventory'>('requirement_map')

  // Live emergency requests state for dynamic inventory calculation
  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const refreshRequests = () => {
    setRequests(getAllRequests())
  }

  useEffect(() => {
    refreshRequests()
    const unsubscribe = subscribeToRequests(refreshRequests)
    return () => unsubscribe()
  }, [])

  const handleCopy = (num: string, name: string) => {
    toast.copy(num)
  }

  // Calculate live allocations per resource category from approved / dispatched citizen requests
  const activeRequests = requests.filter(r => r.status === 'APPROVED' || r.status === 'DISPATCHED')

  const icuAllocated = activeRequests
    .filter(r => r.resourceType.toLowerCase().includes('icu'))
    .reduce((sum, r) => sum + r.quantity, 0)

  const generalAllocated = activeRequests
    .filter(r => r.resourceType.toLowerCase().includes('general') || (r.resourceType.toLowerCase().includes('bed') && !r.resourceType.toLowerCase().includes('icu')))
    .reduce((sum, r) => sum + r.quantity, 0)

  const waterAllocated = activeRequests
    .filter(r => r.resourceType.toLowerCase().includes('water'))
    .reduce((sum, r) => sum + r.quantity, 0)

  const boatsAllocated = activeRequests
    .filter(r => r.resourceType.toLowerCase().includes('boat'))
    .reduce((sum, r) => sum + r.quantity, 0)

  const oxygenAllocated = activeRequests
    .filter(r => r.resourceType.toLowerCase().includes('oxygen') || r.resourceType.toLowerCase().includes('medical'))
    .reduce((sum, r) => sum + r.quantity, 0)

  const foodAllocated = activeRequests
    .filter(r => r.resourceType.toLowerCase().includes('food') || r.resourceType.toLowerCase().includes('ration'))
    .reduce((sum, r) => sum + r.quantity, 0)

  const getAllocatedCount = (id: string): number => {
    if (id === 'icu_beds') return icuAllocated
    if (id === 'general_beds') return generalAllocated
    if (id === 'water_tankers') return waterAllocated
    if (id === 'rescue_boats') return boatsAllocated
    if (id === 'oxygen_kits') return oxygenAllocated
    if (id === 'food_rations') return foodAllocated
    return 0
  }

  // Filter items
  const filteredSupplies = BASE_CAPACITIES.filter(item => {
    if (selectedCategory === 'all') return true
    return item.category === selectedCategory
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 20,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34D399',
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}>
            <Package size={14} />
            {isCitizen ? 'PUBLIC RELIEF AVAILABILITY GRID' : 'MUNICIPAL LOGISTICS GRID'}
          </span>
          <span style={{
            fontSize: 11,
            color: 'var(--tx-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
            Synchronized with Health Dept & BBMP Triage
          </span>
        </div>

        <h1 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 'clamp(24px, 3.2vw, 32px)', color: '#FFFFFF' }}>
          {isCitizen
            ? 'Live Hospital Bed & Municipal Relief Availability'
            : 'Municipal Resource Inventory & Logistics Command'}
        </h1>
        <p className="sub" style={{ margin: 0, fontSize: 14.5, color: 'var(--tx-muted)', maxWidth: 840 }}>
          {isCitizen
            ? 'Transparent, real-time citywide availability of emergency hospital beds, potable water tankers, rescue boats, and supplies across Greater Bengaluru. Quantities update dynamically as citizen emergency requests are allocated and dispatched.'
            : 'Authority logistics console for tracking depot reserves, BBMP sector-wise requirements, and municipal stockpile contingencies across all 8 zones.'}
        </p>
      </div>

      {/* ─── AUTHORITIES ONLY: Tab Switcher ────────────────────── */}
      {!isCitizen && (
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-glass)',
          paddingBottom: 14,
        }}>
          <button
            onClick={() => { playClickSound(); setActiveTab('requirement_map'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: activeTab === 'requirement_map' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'requirement_map' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'requirement_map' ? '#030604' : '#FFFFFF',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Crosshair size={16} />
            <span>📍 Live Ward Requirement & Severity Map</span>
          </button>

          <button
            onClick={() => { playClickSound(); setActiveTab('inventory'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: activeTab === 'inventory' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'inventory' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'inventory' ? '#030604' : '#FFFFFF',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Package size={16} />
            <span>📦 Municipal Depot Inventory Reserves</span>
          </button>
        </div>
      )}

      {/* ─── AUTHORITY VIEW: Requirement Map ──────────────────── */}
      {!isCitizen && activeTab === 'requirement_map' ? (
        <RequirementMap />
      ) : (
        <>
          {/* ─── LIVE SUMMARY STATS CARDS ─────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {/* ICU Beds Card */}
            <div className="bento-card" style={{ border: '1px solid rgba(239, 68, 68, 0.35)', background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.08) 0%, rgba(10, 20, 15, 0.6) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HeartPulse size={18} color="#EF4444" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>Hospital ICU Beds</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Ventilator Critical Care</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5' }}>
                  {icuAllocated > 0 ? `${icuAllocated} Allocated` : 'Full Quota'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF' }}>
                  {Math.max(0, 120 - icuAllocated)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--tx-muted)' }}>/ 120 Beds Available</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#34D399', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} />
                Live admissions active at Bowring & Victoria
              </div>
            </div>

            {/* General Hospital Beds Card */}
            <div className="bento-card" style={{ border: '1px solid rgba(59, 130, 246, 0.35)', background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.08) 0%, rgba(10, 20, 15, 0.6) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bed size={18} color="#60A5FA" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>General Inpatient Beds</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Observation & Ward Care</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD' }}>
                  {generalAllocated > 0 ? `${generalAllocated} In Use` : 'Full Quota'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF' }}>
                  {Math.max(0, 850 - generalAllocated)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--tx-muted)' }}>/ 850 Beds Available</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#60A5FA', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} />
                BBMP Referral Hospitals & Yelahanka GH
              </div>
            </div>

            {/* Potable Water Tankers Card */}
            <div className="bento-card" style={{ border: '1px solid rgba(6, 182, 212, 0.35)', background: 'linear-gradient(145deg, rgba(6, 182, 212, 0.08) 0%, rgba(10, 20, 15, 0.6) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Droplets size={18} color="#22D3EE" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>BWSSB Water Tankers</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>6,000L Tested Drinking Water</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(6, 182, 212, 0.2)', color: '#A5F3FC' }}>
                  {waterAllocated > 0 ? `${waterAllocated} Dispatched` : 'Standby'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF' }}>
                  {Math.max(0, 65 - waterAllocated)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--tx-muted)' }}>/ 65 Tankers Available</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#22D3EE', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} />
                Dispatched dynamically to flooded apartments
              </div>
            </div>

            {/* Rescue Boats Card */}
            <div className="bento-card" style={{ border: '1px solid rgba(16, 185, 129, 0.35)', background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 20, 15, 0.6) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LifeBuoy size={18} color="#34D399" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>SDRF / NDRF Rescue Boats</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Inflatable Motorized Rafts</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7' }}>
                  {boatsAllocated > 0 ? `${boatsAllocated} Deployed` : 'Ready'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF' }}>
                  {Math.max(0, 28 - boatsAllocated)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--tx-muted)' }}>/ 28 Boats Available</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#34D399', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} />
                Stationed at Yelahanka Air Base & BBMP Depots
              </div>
            </div>
          </div>

          {/* ─── CITIZEN NOTICE & REQUEST REDIRECTION BANNER ──── */}
          {isCitizen && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.06) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 16,
              padding: '18px 22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div style={{ maxWidth: 720 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ShieldCheck size={18} color="#34D399" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                    Need Emergency Bed or Tanker Allocation?
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>
                  Hospital beds, water tankers, and rescue boats are reserved directly through your <b>Dashboard Cockpit</b>. When medical triage approves your request, quantities decrement automatically across our network in real-time.
                </p>
              </div>

              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-shiny"
                  style={{
                    padding: '10px 18px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <span>Open Emergency Request in Cockpit</span>
                  <ArrowRight size={15} />
                </motion.button>
              </Link>
            </div>
          )}

          {/* ─── FILTER BAR ───────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Resources' },
                { id: 'beds', label: 'Hospital Beds' },
                { id: 'water', label: 'Drinking Water' },
                { id: 'rescue', label: 'Rescue & Boats' },
                { id: 'medical', label: 'Medical & Oxygen' },
                { id: 'food', label: 'Food Rations' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { playClickSound(); setSelectedCategory(tab.id); }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: selectedCategory === tab.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: selectedCategory === tab.id ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: selectedCategory === tab.id ? '#34D399' : 'var(--tx-muted)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
              Showing {filteredSupplies.length} resource categories
            </div>
          </div>

          {/* ─── LIVE RESOURCE AVAILABILITY TABLE (READ ONLY) ───── */}
          <div className="bento-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                  Citywide Hospital & Relief Stockpile Ledger
                </h3>
                <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>
                  Monitored 24x7 by BBMP Disaster Cell & Health Commissionerate
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#34D399' }}>
                <RefreshCw size={13} className="animate-spin" />
                Live Subtractions Active
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--tx-muted)' }}>
                    <th style={{ padding: '12px 10px' }}>Resource Asset</th>
                    <th style={{ padding: '12px 10px' }}>Total City Quota</th>
                    <th style={{ padding: '12px 10px' }}>In-Service / Allocated</th>
                    <th style={{ padding: '12px 10px' }}>Currently Available</th>
                    <th style={{ padding: '12px 10px' }}>Base Hospitals & Municipal Depots</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Reserve Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupplies.map(item => {
                    const allocated = getAllocatedCount(item.id)
                    const available = Math.max(0, item.totalQuota - allocated)
                    const pctAvailable = Math.round((available / item.totalQuota) * 100)
                    const isCritical = pctAvailable < 30
                    const isHighDemand = pctAvailable < 60 && pctAvailable >= 30
                    const Icon = item.icon

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon size={16} color={item.color} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#FFFFFF' }}>{item.type}</div>
                              <div style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{item.desc}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 10px', color: '#E5E7EB', fontWeight: 600 }}>
                          {item.totalQuota.toLocaleString()} {item.unit}
                        </td>

                        <td style={{ padding: '14px 10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            background: allocated > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: allocated > 0 ? '#FBBF24' : 'var(--tx-muted)',
                          }}>
                            {allocated} {item.unit} Given
                          </span>
                        </td>

                        <td style={{ padding: '14px 10px' }}>
                          <span style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: isCritical ? '#EF4444' : isHighDemand ? '#F59E0B' : '#34D399',
                          }}>
                            {available.toLocaleString()} {item.unit}
                          </span>
                        </td>

                        <td style={{ padding: '14px 10px', color: 'var(--tx-dim)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <MapPin size={13} color="var(--pri-neon)" />
                            {item.location}
                          </div>
                        </td>

                        <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 800,
                            background: isCritical
                              ? 'rgba(239, 68, 68, 0.15)'
                              : isHighDemand
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                            color: isCritical ? '#EF4444' : isHighDemand ? '#F59E0B' : '#34D399',
                            border: `1px solid ${
                              isCritical
                                ? 'rgba(239, 68, 68, 0.3)'
                                : isHighDemand
                                ? 'rgba(245, 158, 11, 0.3)'
                                : 'rgba(16, 185, 129, 0.3)'
                            }`,
                          }}>
                            {isCritical ? 'CRITICAL RESERVES' : isHighDemand ? 'HIGH DEMAND' : 'AVAILABLE'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Emergency Helplines Cockpit ─────────────────────── */}
          <div className="bento-card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: 'var(--tx)' }}>
              Direct Emergency Helplines & Control Rooms
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {EMERGENCY_CONTACTS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF' }}>{c.name}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }}>
                      TOLL FREE {c.tollFree}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--tx-muted)', lineHeight: 1.4 }}>{c.desc}</div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCopy(c.phone, c.name)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--pri-neon)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Copy size={13} /> {c.phone}
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

