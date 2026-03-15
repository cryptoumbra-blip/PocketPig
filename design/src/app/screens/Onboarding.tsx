import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Apple, Shield, Bitcoin, Sprout, Bell, BellOff, Check, Minus, Plus, Fingerprint } from 'lucide-react';
import { PiggyBank } from '../components/PiggyBank';
import { useApp, SavingMode } from '../context/AppContext';

const TOTAL_STEPS = 5;

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

const modeOptions: { id: SavingMode; icon: React.ReactNode; label: string; tagline: string; color: string; desc: string }[] = [
  {
    id: 'safe',
    icon: <Shield size={22} className="text-cyan-400" />,
    label: 'Safe',
    tagline: 'USDC Savings',
    color: '#22D3EE',
    desc: 'Stable, no volatility. Your savings grow safely in USDC.',
  },
  {
    id: 'bitcoin',
    icon: <Bitcoin size={22} className="text-amber-400" />,
    label: 'Bitcoin',
    tagline: 'BTC Savings',
    color: '#FBBF24',
    desc: 'Stack sats every day. Long-term conviction, one tap at a time.',
  },
  {
    id: 'grow',
    icon: <Sprout size={22} className="text-emerald-400" />,
    label: 'Grow',
    tagline: 'STRK + Rewards',
    color: '#34D399',
    desc: 'Earn STRK with optional staking. More risk, more potential.',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setIsOnboarded, mode, setMode, dailyAmount, setDailyAmount, notifications, setNotifications } = useApp();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (step === TOTAL_STEPS - 1) {
      setIsOnboarded(true);
      navigate('/home');
    } else {
      setDirection(1);
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0A0D1A 0%, #0D1220 40%, #0F1828 100%)' }}
    >
      {/* Desktop layout */}
      <div className="flex-1 flex flex-col lg:flex-row lg:items-stretch">

        {/* Left panel (desktop only) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #0D1220 0%, #111827 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)' }} />
            <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full opacity-8"
              style={{ background: 'radial-gradient(circle, #FBBF24 0%, transparent 70%)' }} />
          </div>
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <PiggyBank size={240} pulsing skin="classic" />
          </motion.div>
          <div className="mt-8 text-center relative z-10 px-8">
            <h1 className="text-white mb-3" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
              PocketPig
            </h1>
            <p className="text-white/50" style={{ fontSize: 15, lineHeight: 1.6 }}>
              Your daily savings ritual,<br />powered by Starknet.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              {['🛡️ USDC', '₿ BTC', '🌱 STRK'].map(t => (
                <span key={t} className="px-3 py-1 rounded-full text-white/60"
                  style={{ background: 'rgba(255,255,255,0.06)', fontSize: 12 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel / Mobile full screen */}
        <div className="flex-1 flex flex-col px-6 pt-12 pb-10 lg:justify-center lg:px-12 lg:max-w-md lg:mx-auto w-full">
          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)' }}>
              <span style={{ fontSize: 18 }}>🐷</span>
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>PocketPig</span>
          </div>

          {/* Progress indicator */}
          {step > 0 && (
            <div className="flex gap-1.5 mb-8">
              {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: step > i ? '100%' : '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-1 flex flex-col"
            >
              {step === 0 && <StepWelcome onNext={goNext} />}
              {step === 1 && <StepLogin onNext={goNext} />}
              {step === 2 && <StepMode mode={mode} setMode={setMode} onNext={goNext} />}
              {step === 3 && <StepAmount amount={dailyAmount} setAmount={setDailyAmount} onNext={goNext} />}
              {step === 4 && <StepNotifications notif={notifications} setNotif={setNotifications} onNext={goNext} />}
            </motion.div>
          </AnimatePresence>

          {/* Back button */}
          {step > 1 && (
            <button onClick={goBack}
              className="mt-4 text-white/30 text-sm text-center hover:text-white/60 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Step 0: Welcome ---- */
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-6 lg:hidden"
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(249,115,22,0.35) 0%, transparent 70%)',
            transform: 'scale(1.4)',
          }} />
        <PiggyBank size={180} pulsing />
      </motion.div>

      <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        <span className="text-orange-400" style={{ fontSize: 12, fontWeight: 600 }}>Built on Starknet</span>
      </div>

      <h1 className="text-white mt-3 mb-4" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.15 }}>
        Your piggy bank,<br />
        <span style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          reimagined.
        </span>
      </h1>

      <p className="text-white/50 mb-10 max-w-xs" style={{ fontSize: 15, lineHeight: 1.7 }}>
        Feed your piggy bank every day. Build a savings habit that actually sticks.
      </p>

      <div className="w-full space-y-3 mb-10">
        {[
          { emoji: '🎯', title: 'One daily action', desc: 'Feed your piggy in one tap' },
          { emoji: '🔥', title: 'Build streaks', desc: 'Earn XP, badges & rewards' },
          { emoji: '🔒', title: 'Your savings, your keys', desc: 'Non-custodial on Starknet' },
        ].map(item => (
          <div key={item.title} className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 22 }}>{item.emoji}</span>
            <div className="text-left">
              <div className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
              <div className="text-white/45" style={{ fontSize: 13 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onNext} label="Get Started" />
    </div>
  );
}

/* ---- Step 1: Login ---- */
function StepLogin({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col">
      <h2 className="text-white mb-2" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
        Create your account
      </h2>
      <p className="text-white/45 mb-10" style={{ fontSize: 14 }}>
        No crypto knowledge needed. Sign in in seconds.
      </p>

      <div className="space-y-3 mb-8">
        <SocialButton icon={<Apple size={20} className="text-white" />} label="Continue with Apple" onClick={onNext} />
        <SocialButton
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          }
          label="Continue with Google"
          onClick={onNext}
        />
        <SocialButton
          icon={<Fingerprint size={20} className="text-amber-400" />}
          label="Continue with Passkey"
          onClick={onNext}
          accent
        />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <span className="text-white/30" style={{ fontSize: 12 }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      <button onClick={onNext}
        className="text-center text-white/45 hover:text-white/70 transition-colors"
        style={{ fontSize: 13 }}>
        Connect existing wallet →
      </button>

      <p className="text-center text-white/25 mt-8" style={{ fontSize: 11, lineHeight: 1.6 }}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
        Your data is encrypted and never sold.
      </p>
    </div>
  );
}

/* ---- Step 2: Mode ---- */
function StepMode({ mode, setMode, onNext }: { mode: SavingMode; setMode: (m: SavingMode) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col">
      <h2 className="text-white mb-2" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
        Choose your saving style
      </h2>
      <p className="text-white/45 mb-8" style={{ fontSize: 14 }}>
        You can always change this later.
      </p>

      <div className="space-y-3 mb-10">
        {modeOptions.map(opt => {
          const selected = mode === opt.id;
          return (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode(opt.id)}
              className="w-full text-left p-4 rounded-2xl transition-all"
              style={{
                background: selected
                  ? `linear-gradient(135deg, ${opt.color}18, ${opt.color}08)`
                  : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${selected ? opt.color + '60' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${opt.color}18`, border: `1px solid ${opt.color}30` }}>
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded-full" style={{
                      background: `${opt.color}20`, color: opt.color, fontSize: 11, fontWeight: 600
                    }}>
                      {opt.tagline}
                    </span>
                  </div>
                  <p className="text-white/45" style={{ fontSize: 13, lineHeight: 1.5 }}>{opt.desc}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center"
                  style={{ borderColor: selected ? opt.color : 'rgba(255,255,255,0.2)', background: selected ? opt.color : 'transparent' }}>
                  {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <PrimaryButton onClick={onNext} label={`Start with ${modeOptions.find(m => m.id === mode)?.label}`} />
    </div>
  );
}

/* ---- Step 3: Amount ---- */
function StepAmount({ amount, setAmount, onNext }: { amount: number; setAmount: (a: number) => void; onNext: () => void }) {
  const presets = [1, 5, 10, 25];

  return (
    <div className="flex flex-col">
      <h2 className="text-white mb-2" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
        Set your daily saving
      </h2>
      <p className="text-white/45 mb-8" style={{ fontSize: 14 }}>
        Start small. The habit is what matters.
      </p>

      {/* Amount display */}
      <div className="text-center mb-8">
        <motion.div
          key={amount}
          initial={{ scale: 1.1, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="text-white"
          style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-2px' }}
        >
          ${amount}
        </motion.div>
        <div className="text-white/40" style={{ fontSize: 13 }}>per day</div>
        <div className="mt-2 text-orange-400" style={{ fontSize: 13, fontWeight: 600 }}>
          ≈ ${(amount * 30).toFixed(0)} saved per month
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setAmount(Math.max(1, amount - 1))}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Minus size={20} className="text-white/70" />
        </motion.button>

        <div className="w-24 h-24 rounded-full flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, #F97316, #FBBF24)',
            boxShadow: '0 0 40px rgba(249,115,22,0.4)',
          }}>
          <span className="text-white" style={{ fontSize: 28, fontWeight: 800 }}>${amount}</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setAmount(Math.min(100, amount + 1))}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
        >
          <Plus size={20} className="text-orange-400" />
        </motion.button>
      </div>

      {/* Presets */}
      <div className="flex gap-2 justify-center mb-10">
        {presets.map(p => (
          <motion.button
            key={p}
            whileTap={{ scale: 0.9 }}
            onClick={() => setAmount(p)}
            className="px-4 py-2 rounded-full"
            style={{
              background: amount === p ? 'linear-gradient(135deg, #F97316, #FBBF24)' : 'rgba(255,255,255,0.06)',
              color: amount === p ? 'white' : 'rgba(255,255,255,0.45)',
              fontWeight: 600,
              fontSize: 13,
              border: `1px solid ${amount === p ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            ${p}
          </motion.button>
        ))}
      </div>

      <PrimaryButton onClick={onNext} label="Lock It In 🐷" />
    </div>
  );
}

/* ---- Step 4: Notifications ---- */
function StepNotifications({ notif, setNotif, onNext }: { notif: boolean; setNotif: (v: boolean) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
        <Bell size={40} className="text-orange-400" />
      </div>

      <h2 className="text-white mb-3" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
        Daily reminders
      </h2>
      <p className="text-white/45 mb-10 max-w-xs" style={{ fontSize: 14, lineHeight: 1.7 }}>
        We'll nudge you once a day to feed your piggy. Users with reminders save <strong className="text-orange-400">3× more</strong> consistently.
      </p>

      <div className="w-full space-y-3 mb-10">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => { setNotif(true); }}
          className="w-full flex items-center gap-4 p-4 rounded-2xl"
          style={{
            background: notif ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${notif ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.07)'}`,
          }}
        >
          <Bell size={20} className="text-orange-400" />
          <div className="flex-1 text-left">
            <div className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>Yes, remind me</div>
            <div className="text-white/40" style={{ fontSize: 12 }}>Daily at 9:00 AM (adjustable)</div>
          </div>
          {notif && <Check size={18} className="text-orange-400" />}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setNotif(false)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl"
          style={{
            background: !notif ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${!notif ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
          }}
        >
          <BellOff size={20} className="text-white/40" />
          <div className="flex-1 text-left">
            <div className="text-white/70" style={{ fontWeight: 600, fontSize: 14 }}>No thanks</div>
            <div className="text-white/30" style={{ fontSize: 12 }}>I'll remember on my own</div>
          </div>
          {!notif && <Check size={18} className="text-white/40" />}
        </motion.button>
      </div>

      <PrimaryButton onClick={onNext} label="Start Saving 🎉" />
    </div>
  );
}

/* ---- Shared: Primary Button ---- */
function PrimaryButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="w-full py-4 rounded-2xl text-white flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
        boxShadow: '0 8px 32px rgba(249,115,22,0.35)',
        fontWeight: 700,
        fontSize: 16,
      }}
    >
      {label}
      <ChevronRight size={18} />
    </motion.button>
  );
}

/* ---- Shared: Social Button ---- */
function SocialButton({ icon, label, onClick, accent = false }: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl"
      style={{
        background: accent ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${accent ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
      <span className="text-white flex-1 text-left" style={{ fontWeight: 600, fontSize: 15 }}>{label}</span>
      <ChevronRight size={16} className="text-white/30" />
    </motion.button>
  );
}
