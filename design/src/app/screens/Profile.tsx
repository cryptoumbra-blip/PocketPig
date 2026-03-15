import React, { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Bitcoin, Sprout, Bell, Zap, Crown, Users, ChevronRight, ChevronDown, Copy, Check, Minus, Plus } from 'lucide-react';
import { useApp, SavingMode } from '../context/AppContext';

const modeConfig = {
  safe: { label: 'Safe Mode', icon: Shield, color: '#22D3EE' },
  bitcoin: { label: 'Bitcoin Mode', icon: Bitcoin, color: '#FBBF24' },
  grow: { label: 'Grow Mode', icon: Sprout, color: '#34D399' },
};

export default function Profile() {
  const {
    userName, mode, setMode, dailyAmount, setDailyAmount,
    notifications, setNotifications, autoFeed, setAutoFeed,
    isPremium, totalSaved, streak, level, referralCode
  } = useApp();
  const [copied, setCopied] = useState(false);
  const [editAmount, setEditAmount] = useState(false);
  const [tempAmount, setTempAmount] = useState(dailyAmount);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAmount = () => {
    setDailyAmount(tempAmount);
    setEditAmount(false);
  };

  const cfg = modeConfig[mode];
  const ModeIcon = cfg.icon;

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-white/40 mb-0.5" style={{ fontSize: 13 }}>Account</div>
          <h1 className="text-white" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Profile</h1>
        </div>
        {isPremium && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Crown size={13} className="text-amber-400" />
            <span className="text-amber-400" style={{ fontWeight: 700, fontSize: 12 }}>Premium</span>
          </div>
        )}
      </div>

      {/* User card */}
      <div className="p-5 rounded-3xl mb-5"
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(251,191,36,0.05) 100%)', border: '1px solid rgba(249,115,22,0.2)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', boxShadow: '0 0 20px rgba(249,115,22,0.4)' }}>
            🐷
          </div>
          <div>
            <div className="text-white mb-0.5" style={{ fontWeight: 800, fontSize: 18 }}>{userName}</div>
            <div className="text-white/40" style={{ fontSize: 13 }}>Level {level} · {streak} day streak 🔥</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="text-orange-400" style={{ fontWeight: 800, fontSize: 18 }}>{streak}</div>
            <div className="text-white/30" style={{ fontSize: 10 }}>Streak</div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="text-amber-400" style={{ fontWeight: 800, fontSize: 18 }}>${totalSaved.toFixed(0)}</div>
            <div className="text-white/30" style={{ fontSize: 10 }}>Saved</div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="text-cyan-400" style={{ fontWeight: 800, fontSize: 18 }}>Lv {level}</div>
            <div className="text-white/30" style={{ fontSize: 10 }}>Level</div>
          </div>
        </div>
      </div>

      {/* Saving settings */}
      <SectionLabel label="Saving Settings" />

      {/* Daily amount */}
      <SettingCard className="mb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>Daily saving</div>
            <div className="text-white/40" style={{ fontSize: 12 }}>Per feed amount</div>
          </div>
          <div className="flex items-center gap-2">
            {!editAmount ? (
              <button onClick={() => { setEditAmount(true); setTempAmount(dailyAmount); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
                <span className="text-orange-400" style={{ fontWeight: 700, fontSize: 14 }}>${dailyAmount}</span>
                <ChevronDown size={12} className="text-orange-400" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setTempAmount(Math.max(1, tempAmount - 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Minus size={12} className="text-white/60" />
                </button>
                <span className="text-white" style={{ fontWeight: 700, fontSize: 15, minWidth: 32, textAlign: 'center' }}>
                  ${tempAmount}
                </span>
                <button onClick={() => setTempAmount(Math.min(100, tempAmount + 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(249,115,22,0.15)' }}>
                  <Plus size={12} className="text-orange-400" />
                </button>
                <button onClick={handleSaveAmount}
                  className="px-3 py-1 rounded-lg text-white"
                  style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', fontSize: 12, fontWeight: 600 }}>
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </SettingCard>

      {/* Mode selector */}
      <SettingCard className="mb-5">
        <div className="text-white mb-3" style={{ fontWeight: 600, fontSize: 14 }}>Saving mode</div>
        <div className="flex gap-2">
          {(Object.entries(modeConfig) as [SavingMode, typeof modeConfig['safe']][]).map(([id, cfg]) => {
            const Icon = cfg.icon;
            const active = mode === id;
            return (
              <motion.button key={id} whileTap={{ scale: 0.95 }} onClick={() => setMode(id)}
                className="flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1.5"
                style={{
                  background: active ? `${cfg.color}15` : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${active ? cfg.color + '50' : 'rgba(255,255,255,0.08)'}`,
                }}>
                <Icon size={16} style={{ color: active ? cfg.color : 'rgba(255,255,255,0.35)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? cfg.color : 'rgba(255,255,255,0.35)' }}>
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </SettingCard>

      {/* Preferences */}
      <SectionLabel label="Preferences" />

      <SettingCard className="mb-2">
        <ToggleRow
          label="Daily reminder"
          desc="9:00 AM every day"
          icon={<Bell size={16} className="text-cyan-400" />}
          value={notifications}
          onChange={setNotifications}
        />
      </SettingCard>

      <SettingCard className="mb-5">
        <ToggleRow
          label="Auto Feed"
          desc={isPremium ? 'Automatically save daily' : 'Premium feature'}
          icon={<Zap size={16} className="text-amber-400" />}
          value={autoFeed}
          onChange={isPremium ? setAutoFeed : () => { }}
          disabled={!isPremium}
          premiumBadge={!isPremium}
        />
      </SettingCard>

      {/* Wallet */}
      <SectionLabel label="Wallet" />
      <SettingCard className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>Connected account</div>
            <div className="text-white/40" style={{ fontSize: 12 }}>Google · alex@gmail.com</div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400" style={{ fontSize: 11, fontWeight: 600 }}>Active</span>
          </div>
        </div>
        <div className="mt-3 pt-3 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-white/40" style={{ fontSize: 12 }}>Starknet wallet</div>
          <div className="text-white/50 font-mono" style={{ fontSize: 12 }}>0x1a2b...3c4d</div>
        </div>
      </SettingCard>

      {/* Referral */}
      <SectionLabel label="Invite Friends" />
      <div className="p-4 rounded-2xl mb-5"
        style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(99,102,241,0.05) 100%)', border: '1px solid rgba(34,211,238,0.2)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-cyan-400" />
          <span className="text-white" style={{ fontWeight: 700, fontSize: 14 }}>Refer & earn</span>
          <span className="px-2 py-0.5 rounded-full text-cyan-400"
            style={{ background: 'rgba(34,211,238,0.12)', fontSize: 11, fontWeight: 600 }}>
            +100 XP each
          </span>
        </div>
        <p className="text-white/40 mb-4" style={{ fontSize: 13, lineHeight: 1.5 }}>
          Invite friends and get 100 XP for every friend who feeds their first piggy.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 py-3 px-4 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: 14, color: 'white' }}>
            {referralCode}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleCopy}
            className="px-4 py-3 rounded-xl flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', fontWeight: 700, fontSize: 13, color: 'white' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>
        </div>
        <Link to="/referral">
          <div className="mt-3 flex items-center justify-center gap-1 text-cyan-400"
            style={{ fontSize: 13, fontWeight: 600 }}>
            See referral dashboard <ChevronRight size={14} />
          </div>
        </Link>
      </div>

      {/* Premium */}
      {!isPremium && (
        <>
          <SectionLabel label="Premium" />
          <Link to="/premium">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-2xl mb-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(249,115,22,0.08))', border: '1px solid rgba(251,191,36,0.3)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)' }} />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(251,191,36,0.15)' }}>
                  <Crown size={22} className="text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>Unlock Premium</div>
                  <div className="text-white/40" style={{ fontSize: 13 }}>Auto Feed, custom skins & more</div>
                </div>
                <ChevronRight size={18} className="text-amber-400" />
              </div>
            </motion.div>
          </Link>
        </>
      )}

      {/* Footer */}
      <div className="pt-4 text-center space-y-2">
        <button className="text-white/25 hover:text-white/50 transition-colors" style={{ fontSize: 13 }}>
          Privacy Policy
        </button>
        <div className="text-white/15" style={{ fontSize: 12 }}>PocketPig v1.0.0 · Built on Starknet</div>
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="text-white/35 mb-2" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
      {label}
    </div>
  );
}

function SettingCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 rounded-2xl ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, icon, value, onChange, disabled, premiumBadge }: {
  label: string; desc: string; icon: React.ReactNode; value: boolean;
  onChange: (v: boolean) => void; disabled?: boolean; premiumBadge?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
          {premiumBadge && (
            <span className="px-1.5 py-0.5 rounded text-amber-400"
              style={{ background: 'rgba(251,191,36,0.12)', fontSize: 10, fontWeight: 700 }}>PRO</span>
          )}
        </div>
        <div className="text-white/35" style={{ fontSize: 12 }}>{desc}</div>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
        style={{
          background: value && !disabled ? 'linear-gradient(135deg, #F97316, #FBBF24)' : 'rgba(255,255,255,0.1)',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ left: value && !disabled ? 'calc(100% - 22px)' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
