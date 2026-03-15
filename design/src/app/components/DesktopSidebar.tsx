import React from 'react';
import { NavLink } from 'react-router';
import { motion } from 'motion/react';
import { Home, BarChart2, Star, User, Crown, Users } from 'lucide-react';
import { PiggyBank } from './PiggyBank';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/progress', icon: BarChart2, label: 'Progress' },
  { to: '/rewards', icon: Star, label: 'Rewards' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/premium', icon: Crown, label: 'Premium' },
  { to: '/referral', icon: Users, label: 'Referral' },
];

export const DesktopSidebar: React.FC = () => {
  const { streak, xp, level, totalSaved, mode, pigSkin } = useApp();

  return (
    <aside
      className="w-72 flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        background: 'rgba(10,13,26,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', boxShadow: '0 0 16px rgba(249,115,22,0.4)' }}>
            <span style={{ fontSize: 18 }}>🐷</span>
          </div>
          <span className="text-white" style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.3px' }}>PocketPig</span>
        </div>
      </div>

      {/* Piggy mini display */}
      <div className="px-6 pb-6 flex flex-col items-center"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)', transform: 'scale(1.5)' }} />
          <PiggyBank size={100} skin={pigSkin} pulsing />
        </motion.div>

        <div className="grid grid-cols-3 gap-2 w-full mt-3">
          <div className="p-2 rounded-xl text-center"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <div className="text-orange-400" style={{ fontWeight: 800, fontSize: 15 }}>{streak}</div>
            <div className="text-white/30" style={{ fontSize: 9 }}>Streak</div>
          </div>
          <div className="p-2 rounded-xl text-center"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <div className="text-amber-400" style={{ fontWeight: 800, fontSize: 15 }}>Lv{level}</div>
            <div className="text-white/30" style={{ fontSize: 9 }}>Level</div>
          </div>
          <div className="p-2 rounded-xl text-center"
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
            <div className="text-cyan-400" style={{ fontWeight: 800, fontSize: 15 }}>${totalSaved.toFixed(0)}</div>
            <div className="text-white/30" style={{ fontSize: 9 }}>Saved</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: isActive ? 'rgba(249,115,22,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(249,115,22,0.25)' : 'transparent'}`,
                }}
              >
                <Icon
                  size={18}
                  style={{ color: isActive ? '#FB923C' : 'rgba(255,255,255,0.35)' }}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                <span style={{
                  color: isActive ? '#FB923C' : 'rgba(255,255,255,0.45)',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 14,
                }}>
                  {label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* XP bottom bar */}
      <div className="px-4 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/40" style={{ fontSize: 12 }}>XP Progress</span>
          <span className="text-amber-400" style={{ fontWeight: 700, fontSize: 12 }}>{xp.toLocaleString()}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24)', width: `${(xp / 2000) * 100}%` }}
            initial={{ width: '0%' }}
            animate={{ width: `${(xp / 2000) * 100}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-2 text-white/20" style={{ fontSize: 10 }}>2,000 XP to Level {level + 1}</div>
      </div>
    </aside>
  );
};
