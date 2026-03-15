import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Zap, Trophy, ChevronUp, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const levelNames = ['Piglet', 'Saver', 'Stacker', 'Hoarder', 'Vault Pig', 'Golden Pig'];

const savingsData = [
  { day: 'Feb 9', amount: 5 },
  { day: 'Feb 16', amount: 25 },
  { day: 'Feb 23', amount: 50 },
  { day: 'Mar 2', amount: 90 },
  { day: 'Mar 7', amount: 156.5 },
];

const monthDays = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  saved: i < 12 ? Math.random() > 0.1 : i < 18 ? Math.random() > 0.25 : false,
}));
monthDays[17] = { day: 18, saved: false }; // one miss

const weeklyRank = [
  { rank: 1, name: 'Maria S.', xp: 2100, you: false },
  { rank: 2, name: 'James K.', xp: 1890, you: false },
  { rank: 3, name: 'You', xp: 1240, you: true },
  { rank: 4, name: 'Sophie W.', xp: 1180, you: false },
  { rank: 5, name: 'Kai L.', xp: 980, you: false },
];

export default function Progress() {
  const { streak, xp, level, xpToNextLevel, totalSaved, badges, dailyAmount, weekHistory } = useApp();
  const [activeTab, setActiveTab] = useState<'progress' | 'ranking'>('progress');
  const xpPct = Math.min(100, (xp / xpToNextLevel) * 100);
  const earnedBadges = badges.filter(b => b.earned);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="px-3 py-2 rounded-xl"
          style={{ background: '#1C2440', border: '1px solid rgba(249,115,22,0.3)' }}>
          <div className="text-orange-400" style={{ fontWeight: 700, fontSize: 13 }}>${payload[0].value}</div>
          <div className="text-white/40" style={{ fontSize: 11 }}>{payload[0].payload.day}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-white/40 mb-0.5" style={{ fontSize: 13 }}>Your journey</div>
          <h1 className="text-white" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Progress</h1>
        </div>
        <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <Flame size={13} className="text-orange-400" />
          <span className="text-orange-400" style={{ fontWeight: 700, fontSize: 13 }}>{streak}</span>
        </div>
      </div>

      {/* Level card */}
      <div className="p-5 rounded-3xl mb-4"
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(251,191,36,0.06) 100%)', border: '1px solid rgba(249,115,22,0.2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-amber-400" />
              <span className="text-amber-400" style={{ fontWeight: 700, fontSize: 13 }}>Level {level}</span>
            </div>
            <div className="text-white" style={{ fontWeight: 800, fontSize: 22 }}>{levelNames[level - 1]}</div>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', boxShadow: '0 0 24px rgba(249,115,22,0.4)' }}>
            <span style={{ fontSize: 26 }}>🐷</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50" style={{ fontSize: 12 }}>{xp.toLocaleString()} XP</span>
          <span className="text-white/30" style={{ fontSize: 12 }}>{xpToNextLevel.toLocaleString()} XP to Lv {level + 1}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            className="h-full rounded-full relative"
            style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg"
              style={{ boxShadow: '0 0 8px rgba(249,115,22,0.8)' }} />
          </motion.div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <ChevronUp size={14} className="text-emerald-400" />
          <span className="text-emerald-400" style={{ fontSize: 12, fontWeight: 600 }}>+50 XP from today's feed</span>
        </div>
      </div>

      {/* Level progression */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {levelNames.map((name, i) => {
          const lvl = i + 1;
          const isPast = lvl < level;
          const isCurrent = lvl === level;
          return (
            <div key={name} className="flex-shrink-0 flex flex-col items-center gap-1.5">
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: isPast
                    ? 'linear-gradient(135deg, #F97316, #FBBF24)'
                    : isCurrent
                      ? 'rgba(249,115,22,0.2)'
                      : 'rgba(255,255,255,0.05)',
                  border: isCurrent ? '1.5px solid rgba(249,115,22,0.6)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isCurrent ? '0 0 16px rgba(249,115,22,0.3)' : 'none',
                }}
                animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span style={{ fontSize: isPast ? 16 : 14 }}>{isPast ? '✓' : `${lvl}`}</span>
              </motion.div>
              <span className={`text-center`}
                style={{ fontSize: 9, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? '#FB923C' : 'rgba(255,255,255,0.25)', maxWidth: 48 }}>
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Savings chart */}
      <div className="p-4 rounded-2xl mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>Total saved</div>
            <div className="text-orange-400" style={{ fontWeight: 800, fontSize: 24 }}>${totalSaved.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-white/35" style={{ fontSize: 12 }}>Since joining</div>
            <div className="text-emerald-400" style={{ fontSize: 12, fontWeight: 600 }}>+12.3% projected</div>
          </div>
        </div>
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={savingsData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#F97316" strokeWidth={2.5} fill="url(#savingsGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 30-day calendar */}
      <div className="p-4 rounded-2xl mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>Last 30 days</span>
          <div className="flex items-center gap-1.5">
            <Target size={13} className="text-orange-400" />
            <span className="text-orange-400" style={{ fontSize: 12, fontWeight: 600 }}>
              {monthDays.filter(d => d.saved).length}/30
            </span>
          </div>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {monthDays.map(({ day, saved }) => (
            <motion.div
              key={day}
              className="aspect-square rounded-md flex items-center justify-center"
              style={{
                background: saved
                  ? 'linear-gradient(135deg, #F97316, #FBBF24)'
                  : 'rgba(255,255,255,0.05)',
                boxShadow: saved ? '0 0 6px rgba(249,115,22,0.35)' : 'none',
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: day * 0.02, duration: 0.3 }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm"
              style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)' }} />
            <span className="text-white/40" style={{ fontSize: 11 }}>Saved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <span className="text-white/40" style={{ fontSize: 11 }}>Missed</span>
          </div>
        </div>
      </div>

      {/* Tabs: Progress | Ranking */}
      <div className="flex p-1 rounded-xl mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {(['progress', 'ranking'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 rounded-lg capitalize"
            style={{
              background: activeTab === tab ? 'rgba(249,115,22,0.15)' : 'transparent',
              color: activeTab === tab ? '#FB923C' : 'rgba(255,255,255,0.35)',
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 13,
              border: activeTab === tab ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent',
            }}>
            {tab === 'progress' ? 'Your Progress' : '🏆 Weekly Rank'}
          </button>
        ))}
      </div>

      {activeTab === 'progress' ? (
        /* Badge preview */
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>Earned badges</span>
            <span className="text-orange-400" style={{ fontSize: 12, fontWeight: 600 }}>{earnedBadges.length} of {badges.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {earnedBadges.map(b => (
              <motion.div
                key={b.id}
                whileTap={{ scale: 0.93 }}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', minWidth: 76 }}
              >
                <span style={{ fontSize: 26 }}>{b.emoji}</span>
                <span className="text-white/70 text-center" style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.3 }}>
                  {b.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Weekly ranking */
        <div className="space-y-2">
          {weeklyRank.map(({ rank, name, xp: points, you }) => (
            <motion.div
              key={rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rank * 0.08 }}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{
                background: you ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${you ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: rank === 1 ? 'linear-gradient(135deg, #F59E0B, #FCD34D)'
                    : rank === 2 ? 'rgba(148,163,184,0.2)'
                      : rank === 3 ? 'rgba(180,83,9,0.2)' : 'rgba(255,255,255,0.06)',
                }}>
                <span style={{ fontSize: rank <= 3 ? 14 : 12, fontWeight: 700, color: rank <= 3 ? 'white' : 'rgba(255,255,255,0.4)' }}>
                  {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
                </span>
              </div>
              <div className="flex-1">
                <div style={{ color: you ? '#FB923C' : 'white', fontWeight: you ? 700 : 500, fontSize: 14 }}>
                  {name} {you && '(you)'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Zap size={12} className="text-amber-400" />
                <span className="text-amber-400" style={{ fontWeight: 700, fontSize: 13 }}>{points.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
