import React, { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Bitcoin, Sprout, Flame, Zap, ChevronRight, Trophy, Settings } from 'lucide-react';
import { PiggyBank, FloatingCoin, XPFloat } from '../components/PiggyBank';
import { useApp } from '../context/AppContext';

const modeConfig = {
  safe: { label: 'Safe', icon: Shield, color: '#22D3EE', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.25)' },
  bitcoin: { label: 'Bitcoin', icon: Bitcoin, color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
  grow: { label: 'Grow', icon: Sprout, color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
};

export default function Home() {
  const { mode, streak, xp, level, xpToNextLevel, fedToday, totalSaved, dailyAmount, feed, weekHistory, weeklyProgress, weeklyTarget } = useApp();
  const [showCoin, setShowCoin] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [pigHappy, setPigHappy] = useState(false);
  const [feeding, setFeeding] = useState(false);

  const cfg = modeConfig[mode];
  const ModeIcon = cfg.icon;
  const xpPct = Math.min(100, (xp / xpToNextLevel) * 100);

  const handleFeed = async () => {
    if (fedToday || feeding) return;
    setFeeding(true);

    // Trigger animations
    setShowCoin(true);
    setTimeout(() => {
      setShowXP(true);
      setPigHappy(true);
      feed();
    }, 400);
    setTimeout(() => {
      setShowCoin(false);
      setShowXP(false);
    }, 1600);
    setTimeout(() => {
      setPigHappy(false);
      setFeeding(false);
    }, 2200);
  };

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6 relative overflow-hidden lg:px-8">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)', top: '8%' }} />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #FBBF24 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <div className="text-white/45 mb-0.5" style={{ fontSize: 13 }}>Good morning 👋</div>
          <div className="text-white" style={{ fontWeight: 700, fontSize: 20 }}>Your Piggy</div>
        </div>
        <div className="flex items-center gap-3">
          {/* Level badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Trophy size={13} className="text-amber-400" />
            <span className="text-amber-400" style={{ fontWeight: 700, fontSize: 12 }}>Lv {level}</span>
          </div>
          <Link to="/profile">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Settings size={16} className="text-white/60" />
            </div>
          </Link>
        </div>
      </div>

      {/* Mode chip */}
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <ModeIcon size={13} style={{ color: cfg.color }} />
          <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>{cfg.label} Mode</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Flame size={13} className="text-orange-400" />
          <span className="text-orange-400" style={{ fontWeight: 700, fontSize: 12 }}>{streak} day streak</span>
        </div>
      </div>

      {/* Hero: Piggy Bank */}
      <div className="relative flex items-center justify-center mb-8 z-10">
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 260,
            height: 260,
            background: fedToday
              ? 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Piggy */}
        <div className="relative">
          <motion.div
            animate={feeding ? {
              rotate: [0, -8, 8, -5, 5, 0],
              scale: [1, 1.08, 0.95, 1.04, 1],
            } : {}}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <PiggyBank size={200} happy={pigHappy} pulsing={!fedToday} />
          </motion.div>

          {/* Floating coin */}
          <FloatingCoin visible={showCoin} />
          {/* XP float */}
          <XPFloat visible={showXP} amount={50} />
        </div>
      </div>

      {/* Feed button or Fed state */}
      <div className="relative z-10 mb-6">
        <AnimatePresence mode="wait">
          {!fedToday ? (
            <motion.button
              key="feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={handleFeed}
              disabled={feeding}
              className="w-full py-5 rounded-2xl text-white flex items-center justify-center gap-3"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
                boxShadow: '0 8px 40px rgba(249,115,22,0.45)',
                fontWeight: 700,
                fontSize: 17,
              }}
            >
              <span style={{ fontSize: 22 }}>🐷</span>
              Feed today's savings
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-sm font-bold">+50 XP</span>
            </motion.button>
          ) : (
            <motion.div
              key="fed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full py-5 rounded-2xl flex items-center justify-center gap-3"
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1.5px solid rgba(34,197,94,0.3)',
              }}
            >
              <span style={{ fontSize: 22 }}>✅</span>
              <span className="text-emerald-400" style={{ fontWeight: 700, fontSize: 17 }}>Fed! Come back tomorrow</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
        <StatCard
          icon={<Flame size={16} className="text-orange-400" />}
          value={`${streak}`}
          label="Day streak"
          glow="rgba(249,115,22,0.15)"
        />
        <StatCard
          icon={<Zap size={16} className="text-amber-400" />}
          value={`${xp.toLocaleString()}`}
          label="Total XP"
          glow="rgba(251,191,36,0.12)"
        />
        <StatCard
          icon={<span style={{ fontSize: 14 }}>💰</span>}
          value={`$${totalSaved.toFixed(0)}`}
          label="Total saved"
          glow="rgba(34,211,238,0.1)"
        />
      </div>

      {/* Weekly streak tracker */}
      <div className="p-4 rounded-2xl mb-4 relative z-10"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/70" style={{ fontWeight: 600, fontSize: 13 }}>This week</span>
          <span className="text-orange-400" style={{ fontSize: 12, fontWeight: 600 }}>{weekHistory.filter(Boolean).length}/7 days</span>
        </div>
        <div className="flex gap-1.5 justify-between">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: weekHistory[i]
                    ? 'linear-gradient(135deg, #F97316, #FBBF24)'
                    : i === 6 && fedToday
                      ? 'linear-gradient(135deg, #22C55E, #4ADE80)'
                      : 'rgba(255,255,255,0.06)',
                  boxShadow: weekHistory[i] ? '0 0 12px rgba(249,115,22,0.4)' : 'none',
                }}
                animate={weekHistory[i] ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
              >
                {weekHistory[i] ? (
                  <Flame size={14} className="text-white" />
                ) : (
                  <span className="text-white/20" style={{ fontSize: 12, fontWeight: 600 }}>{d}</span>
                )}
              </motion.div>
              <span className="text-white/30" style={{ fontSize: 9, fontWeight: 500 }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly progress bar */}
      <div className="p-4 rounded-2xl relative z-10"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/70" style={{ fontWeight: 600, fontSize: 13 }}>Weekly target</div>
            <div className="text-white/35" style={{ fontSize: 12 }}>Saved ${weeklyProgress} of ${weeklyTarget}</div>
          </div>
          <Link to="/progress">
            <div className="flex items-center gap-1 text-orange-400" style={{ fontSize: 12, fontWeight: 600 }}>
              Details <ChevronRight size={14} />
            </div>
          </Link>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${(weeklyProgress / weeklyTarget) * 100}%` }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <span className="text-orange-400" style={{ fontSize: 11, fontWeight: 600 }}>
            ${(weeklyTarget - weeklyProgress).toFixed(0)} to go
          </span>
        </div>
      </div>

      {/* Today's reward */}
      {!fedToday && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-3 rounded-xl flex items-center gap-3 relative z-10"
          style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)' }}
        >
          <span style={{ fontSize: 18 }}>⚡</span>
          <div>
            <div className="text-amber-400" style={{ fontWeight: 600, fontSize: 13 }}>Today's reward</div>
            <div className="text-white/40" style={{ fontSize: 12 }}>+50 XP + streak bonus</div>
          </div>
          <div className="ml-auto px-2.5 py-1 rounded-full text-amber-400"
            style={{ background: 'rgba(251,191,36,0.12)', fontSize: 11, fontWeight: 700 }}>
            Claim
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, glow }: { icon: React.ReactNode; value: string; label: string; glow: string }) {
  return (
    <div className="p-3 rounded-2xl text-center"
      style={{ background: `${glow}`, border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-white" style={{ fontWeight: 700, fontSize: 16 }}>{value}</div>
      <div className="text-white/35" style={{ fontSize: 10 }}>{label}</div>
    </div>
  );
}