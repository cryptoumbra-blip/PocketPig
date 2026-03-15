import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Share2 } from 'lucide-react';
import { useApp, type Badge } from '../context/AppContext';

export default function Rewards() {
  const { badges } = useApp();
  const [selected, setSelected] = useState<Badge | null>(null);

  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6">
      {/* Header */}
      <div className="mb-8">
        <div className="text-white/40 mb-0.5" style={{ fontSize: 13 }}>Your collection</div>
        <h1 className="text-white" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Badges</h1>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(251,191,36,0.06))', border: '1px solid rgba(249,115,22,0.2)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', boxShadow: '0 0 20px rgba(249,115,22,0.4)', fontSize: 13, fontWeight: 800 }}>
          XP
        </div>
        <div>
          <div className="text-white" style={{ fontWeight: 800, fontSize: 20 }}>
            {earned.length} <span className="text-white/30" style={{ fontWeight: 400, fontSize: 16 }}>/ {badges.length}</span>
          </div>
          <div className="text-white/45" style={{ fontSize: 13 }}>Badges earned</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-amber-400" style={{ fontWeight: 700, fontSize: 16 }}>
            {Math.round((earned.length / badges.length) * 100)}%
          </div>
          <div className="text-white/30" style={{ fontSize: 12 }}>Complete</div>
        </div>
      </div>

      {/* Earned */}
      <div className="mb-6">
        <div className="text-white/60 mb-3" style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Earned ({earned.length})
        </div>
        <div className="grid grid-cols-2 gap-3">
          {earned.map((badge, i) => (
            <motion.button
              key={badge.id}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelected(badge)}
              className="p-4 rounded-2xl text-left relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(251,191,36,0.05) 100%)',
                border: '1px solid rgba(249,115,22,0.25)',
              }}
            >
              {/* Shine effect */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

              <div className="flex items-start justify-between mb-3">
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(249,115,22,0.15)',
                    boxShadow: '0 0 20px rgba(249,115,22,0.25)',
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{badge.icon}</span>
                </motion.div>
                <div className="px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <span className="text-emerald-400" style={{ fontSize: 9, fontWeight: 700 }}>EARNED</span>
                </div>
              </div>

              <div className="text-white mb-0.5" style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
                {badge.name}
              </div>
              <div className="text-white/35" style={{ fontSize: 11, lineHeight: 1.4 }}>
                {badge.description}
              </div>
              <div className="mt-2 text-white/35" style={{ fontSize: 10 }}>
                {badge.goalLabel}
              </div>
              <div className="mt-2 text-amber-400/80" style={{ fontSize: 10, fontWeight: 700 }}>
                +{badge.xpAwarded} XP
              </div>
              {badge.earnedDate && (
                <div className="mt-2 text-orange-400/60" style={{ fontSize: 10 }}>
                  {badge.earnedDate}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Locked */}
      <div>
        <div className="text-white/40 mb-3" style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Locked ({locked.length})
        </div>
        <div className="grid grid-cols-2 gap-3">
          {locked.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 + 0.3 }}
              className="p-4 rounded-2xl relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>{badge.icon}</span>
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <Lock size={14} className="text-white/40" />
                  </div>
                </div>
              </div>

              <div className="text-white/40 mb-0.5" style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
                {badge.name}
              </div>
              <div className="text-white/25" style={{ fontSize: 11, lineHeight: 1.4 }}>
                {badge.description}
              </div>
              <div className="mt-2 text-white/20" style={{ fontSize: 10 }}>
                {badge.goalLabel}
              </div>
              <div className="mt-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (badge.progress / badge.target) * 100)}%`,
                      background: 'linear-gradient(90deg, #F97316, #FBBF24)',
                    }}
                  />
                </div>
                <div className="mt-1 text-white/25" style={{ fontSize: 10 }}>
                  {badge.progressLabel}
                </div>
              </div>
              <div className="mt-2 text-white/20" style={{ fontSize: 10, fontWeight: 700 }}>
                +{badge.xpAwarded} XP
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #1C2440 0%, #111827 100%)',
                border: '1px solid rgba(249,115,22,0.3)',
                boxShadow: '0 0 60px rgba(249,115,22,0.2)',
              }}
            >
              {/* Glow top */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.6), transparent)' }} />

              <button onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <X size={15} className="text-white/60" />
              </button>

              <motion.div
                className="mx-auto w-24 h-24 rounded-3xl flex items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(251,191,36,0.1))',
                  border: '1.5px solid rgba(249,115,22,0.4)',
                  boxShadow: '0 0 40px rgba(249,115,22,0.3)',
                }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{selected.icon}</span>
              </motion.div>

              <div className="px-2 py-1 rounded-full inline-block mb-3"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <span className="text-emerald-400" style={{ fontSize: 11, fontWeight: 700 }}>BADGE EARNED</span>
              </div>

              <h2 className="text-white mb-2" style={{ fontSize: 22, fontWeight: 800 }}>
                {selected.name}
              </h2>
              <p className="text-white/45 mb-4" style={{ fontSize: 14, lineHeight: 1.6 }}>
                {selected.description}
              </p>
              <div className="text-white/35 mb-2" style={{ fontSize: 12 }}>
                {selected.goalLabel}
              </div>
              <div className="text-amber-400 mb-3" style={{ fontSize: 13, fontWeight: 700 }}>
                Reward: +{selected.xpAwarded} XP
              </div>

              {selected.earnedDate && (
                <div className="text-orange-400/70 mb-6" style={{ fontSize: 13 }}>
                  Earned on {selected.earnedDate}
                </div>
              )}

              <button
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-white"
                style={{ background: 'rgba(255,255,255,0.08)', fontWeight: 600, fontSize: 14 }}
              >
                <Share2 size={15} />
                Share Badge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
