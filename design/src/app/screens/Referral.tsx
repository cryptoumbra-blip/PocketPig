import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, Copy, Check, Share2, Users, Zap, Gift } from 'lucide-react';
import { useApp } from '../context/AppContext';

const mockFriends = [
  { name: 'Sarah M.', avatar: '🌸', joined: 'Mar 5', status: 'active', streak: 3, xpEarned: 100 },
  { name: 'Diego R.', avatar: '🦊', joined: 'Mar 2', status: 'active', streak: 5, xpEarned: 100 },
];

const steps = [
  { emoji: '🔗', title: 'Share your link', desc: 'Send your unique invite to friends' },
  { emoji: '🐷', title: 'Friend joins', desc: 'They create their PocketPig account' },
  { emoji: '⚡', title: 'Both earn XP', desc: '+100 XP when they feed their first piggy' },
];

export default function Referral() {
  const navigate = useNavigate();
  const { referralCode, xp } = useApp();
  const [copied, setCopied] = useState(false);
  const referralLink = `pocketpig.app/join/${referralCode}`;
  const totalReferrals = mockFriends.length;
  const totalXpEarned = mockFriends.reduce((sum, f) => sum + f.xpEarned, 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-64 opacity-15"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #22D3EE 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronLeft size={18} className="text-white/60" />
        </button>
        <div>
          <h1 className="text-white" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Refer Friends</h1>
          <p className="text-white/40" style={{ fontSize: 13 }}>Grow your piggy squad</p>
        </div>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl mb-6 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.1) 0%, rgba(99,102,241,0.06) 100%)',
          border: '1px solid rgba(34,211,238,0.2)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)' }} />

        <div className="text-5xl mb-3">🐷</div>
        <h2 className="text-white mb-2" style={{ fontSize: 22, fontWeight: 800 }}>
          Invite friends,<br />
          <span style={{ background: 'linear-gradient(90deg, #22D3EE, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            earn together
          </span>
        </h2>
        <p className="text-white/45" style={{ fontSize: 14, lineHeight: 1.6 }}>
          For every friend who joins and feeds their first piggy, you both get +100 XP.
        </p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="text-cyan-400" style={{ fontWeight: 800, fontSize: 20 }}>{totalReferrals}</div>
            <div className="text-white/35" style={{ fontSize: 11 }}>Friends</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="text-amber-400" style={{ fontWeight: 800, fontSize: 20 }}>{totalXpEarned}</div>
            <div className="text-white/35" style={{ fontSize: 11 }}>XP earned</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="text-emerald-400" style={{ fontWeight: 800, fontSize: 20 }}>#3</div>
            <div className="text-white/35" style={{ fontSize: 11 }}>Rank</div>
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <div className="mb-6">
        <div className="text-white/50 mb-3" style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          How it works
        </div>
        <div className="flex gap-2">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 p-3 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div style={{ fontSize: 24 }} className="mb-2">{step.emoji}</div>
              <div className="text-white mb-1" style={{ fontWeight: 700, fontSize: 12 }}>{step.title}</div>
              <div className="text-white/35" style={{ fontSize: 10, lineHeight: 1.4 }}>{step.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Share link */}
      <div className="mb-6">
        <div className="text-white/50 mb-3" style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Your invite link
        </div>
        <div className="p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 py-2.5 px-3 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>
              {referralLink}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)'}`,
              }}
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-orange-400" />}
            </motion.button>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-white"
              style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', fontWeight: 700, fontSize: 14 }}
            >
              <Share2 size={15} />
              Share now
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="px-4 py-3 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14 }}
            >
              <Gift size={15} />
              Gift
            </motion.button>
          </div>
        </div>
      </div>

      {/* Friends list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-white/50" style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Your squad ({mockFriends.length})
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-cyan-400" />
            <span className="text-cyan-400" style={{ fontSize: 12, fontWeight: 600 }}>Active</span>
          </div>
        </div>

        <div className="space-y-2">
          {mockFriends.map((friend, i) => (
            <motion.div
              key={friend.name}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                {friend.avatar}
              </div>
              <div className="flex-1">
                <div className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>{friend.name}</div>
                <div className="text-white/35" style={{ fontSize: 12 }}>Joined {friend.joined} · {friend.streak} day streak</div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <Zap size={11} className="text-amber-400" />
                <span className="text-amber-400" style={{ fontSize: 11, fontWeight: 700 }}>+{friend.xpEarned}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 p-4 rounded-2xl flex flex-col items-center text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
        >
          <div className="text-3xl mb-2">🐷</div>
          <div className="text-white/35" style={{ fontSize: 13 }}>Waiting for more piggies to join...</div>
          <button onClick={handleCopy}
            className="mt-3 text-orange-400 hover:text-orange-300 transition-colors"
            style={{ fontSize: 13, fontWeight: 600 }}>
            {copied ? '✅ Copied!' : '+ Invite another friend'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
