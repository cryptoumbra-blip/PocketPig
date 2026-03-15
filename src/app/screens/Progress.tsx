import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Zap, Trophy, ChevronUp, Target, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchWeeklyLeaderboard, type WeeklyLeaderboardEntry } from '../../lib/backend';

interface SavingsTooltipPayload {
  value: number;
  payload: {
    day: string;
  };
}

interface SavingsTooltipProps {
  active?: boolean;
  payload?: SavingsTooltipPayload[];
}

function SavingsTooltip({ active, payload }: SavingsTooltipProps) {
  if (active && payload?.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl"
        style={{
          background: '#1C2440',
          border: '1px solid rgba(249,115,22,0.3)',
        }}
      >
        <div className="text-orange-400" style={{ fontWeight: 700, fontSize: 13 }}>
          {payload[0].value} feeds
        </div>
        <div className="text-white/40" style={{ fontSize: 11 }}>
          {payload[0].payload.day}
        </div>
      </div>
    );
  }

  return null;
}

export default function Progress() {
  const {
    streak,
    xp,
    level,
    xpToNextLevel,
    currentLevelXp,
    currentLevelCap,
    levelTitle,
    levelProgressPercent,
    totalFeedCount,
    badges,
    missions,
    lastFeedXp,
    monthHistory,
    savingsSeries,
    walletAddress,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'progress' | 'ranking'>('progress');
  const [weeklyRank, setWeeklyRank] = useState<WeeklyLeaderboardEntry[]>([]);
  const [weeklyRankLoading, setWeeklyRankLoading] = useState(false);
  const [weeklyRankError, setWeeklyRankError] = useState<string | null>(null);
  const earnedBadges = badges.filter(b => b.earned);

  useEffect(() => {
    let cancelled = false;

    const loadWeeklyRank = async () => {
      setWeeklyRankLoading(true);
      setWeeklyRankError(null);
      try {
        const response = await fetchWeeklyLeaderboard({
          walletAddress,
        });
        if (!cancelled) {
          setWeeklyRank(response.entries);
        }
      } catch (error) {
        if (!cancelled) {
          setWeeklyRank([]);
          setWeeklyRankError(error instanceof Error ? error.message : 'Weekly rank could not load.');
        }
      } finally {
        if (!cancelled) {
          setWeeklyRankLoading(false);
        }
      }
    };

    void loadWeeklyRank();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

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
            <div className="text-white" style={{ fontWeight: 800, fontSize: 22 }}>{levelTitle}</div>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', boxShadow: '0 0 24px rgba(249,115,22,0.4)' }}>
            <Trophy size={24} className="text-white" />
          </div>
        </div>

        {/* XP bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50" style={{ fontSize: 12 }}>
            {currentLevelXp.toLocaleString()} / {currentLevelCap.toLocaleString()} XP
          </span>
          <span className="text-white/30" style={{ fontSize: 12 }}>{xpToNextLevel.toLocaleString()} XP to Lv {level + 1}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            className="h-full rounded-full relative"
            style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${levelProgressPercent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg"
              style={{ boxShadow: '0 0 8px rgba(249,115,22,0.8)' }} />
          </motion.div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <ChevronUp size={14} className="text-emerald-400" />
          <span className="text-emerald-400" style={{ fontSize: 12, fontWeight: 600 }}>
            {lastFeedXp > 0 ? `+${lastFeedXp} XP earned today` : 'Feed today to earn fresh XP'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MiniProgressCard label="Level" value={`Lv ${level}`} />
        <MiniProgressCard label="Lifetime XP" value={xp.toLocaleString()} />
        <MiniProgressCard label="Next level" value={xpToNextLevel.toLocaleString()} />
      </div>

      <div className="p-4 rounded-2xl mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>Active missions</div>
          <span className="text-white/35" style={{ fontSize: 12 }}>{missions.filter((mission) => mission.complete).length}/{missions.length}</span>
        </div>
        <div className="space-y-3">
          {missions.map((mission) => {
            const progressPercent = Math.min(100, (mission.progress / mission.target) * 100);
            return (
              <div
                key={mission.id}
                className="p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-white" style={{ fontWeight: 700, fontSize: 14 }}>{mission.title}</div>
                    <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.5 }}>{mission.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-amber-400" style={{ fontSize: 12, fontWeight: 700 }}>+{mission.xpReward} XP</div>
                    {mission.complete ? (
                      <div className="flex items-center gap-1 text-emerald-400" style={{ fontSize: 11, fontWeight: 600 }}>
                        <CheckCircle2 size={12} />
                        Complete
                      </div>
                    ) : (
                      <div className="text-white/30" style={{ fontSize: 11 }}>
                        {mission.progress}/{mission.target}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progressPercent}%`, background: mission.complete ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #F97316, #FBBF24)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity chart */}
      <div className="p-4 rounded-2xl mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>Total feed actions</div>
            <div className="text-orange-400" style={{ fontWeight: 800, fontSize: 24 }}>{totalFeedCount}</div>
          </div>
          <div className="text-right">
            <div className="text-white/35" style={{ fontSize: 12 }}>Since joining</div>
            <div className="text-emerald-400" style={{ fontSize: 12, fontWeight: 600 }}>Cumulative actions</div>
          </div>
        </div>
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={savingsSeries} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<SavingsTooltip />} />
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
              {monthHistory.filter(d => d.saved).length}/30
            </span>
          </div>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {monthHistory.map(({ day, saved }) => (
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
            <span className="text-white/40" style={{ fontSize: 11 }}>Fed</span>
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
            {tab === 'progress' ? 'Your Progress' : 'Weekly Rank'}
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: 'rgba(249,115,22,0.18)', fontSize: 11, fontWeight: 800 }}>
                  {b.icon}
                </div>
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
          {weeklyRankLoading && (
            <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.7 }}>
              Loading weekly rank...
            </div>
          )}

          {!weeklyRankLoading && weeklyRankError && (
            <div className="text-red-300" style={{ fontSize: 12, lineHeight: 1.7 }}>
              {weeklyRankError}
            </div>
          )}

          {!weeklyRankLoading && !weeklyRankError && weeklyRank.length === 0 && (
            <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.7 }}>
              No weekly rank yet. Once users earn XP onchain, the table will fill from Supabase.
            </div>
          )}

          {weeklyRank.map(({ rank, name, xp: points, you }, index) => (
            <motion.div
              key={`${rank}-${name}-${index}`}
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
                  {rank}
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

function MiniProgressCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>
        {value}
      </div>
      <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
        {label}
      </div>
    </div>
  );
}
