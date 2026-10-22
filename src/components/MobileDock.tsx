import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  Zap,
  Radio,
  CheckSquare,
  Package,
} from 'lucide-react';
import { playClickSound } from '../utils/audioFeedback';

const MOBILE_NAV_ITEMS = [
  { path: '/dashboard', label: 'Cockpit', icon: LayoutDashboard },
  { path: '/yelahanka', label: 'Live Hub', icon: Radio },
  { path: '/risk-map', label: 'Risk Map', icon: Map },
  { path: '/preparedness', label: 'Go-Bag', icon: CheckSquare },
  { path: '/resources', label: 'Logistics', icon: Package },
];

export default function MobileDock() {
  const location = useLocation();

  return (
    <nav className="mobile-dock">
      {MOBILE_NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            onClick={() => playClickSound()}
            style={{ textDecoration: 'none' }}
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                color: isActive ? '#34D399' : 'rgba(255,255,255,0.65)',
                padding: '6px 8px',
                borderRadius: 12,
                background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: 9, fontWeight: isActive ? 800 : 500, letterSpacing: 0.1 }}>
                {label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
