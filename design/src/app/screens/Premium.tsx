import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Zap, Shield, Palette, Star, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { PiggyBank } from '../components/PiggyBank';
import { useApp } from '../context/AppContext';

const skins = [
  { id: 'classic', name: 'Classic', emoji: '🐷', price: 'Free', owned: true, color: '#F97316' },
  { id: 'golden', name: 'Golden', emoji: '✨', price: 'Premium', owned: false, color: '#F59E0B' },
  { id: 'midnight', name: 'Midnight', emoji: '🌙', price: 'Premium', owned: false, color: '#818CF8' },
  { id: 'emerald', name: 'Emerald', emoji: '💚', price: 'Premium', owned: false, color: '#10B981' },
  { id: 'rose', name: 'Rose', emoji: '🌸', price: 'Premium', owned: false, color: '#F43F5E' },
];

const premiumBenefits = [
  { icon: <Zap size={18} className="text-amber-400" />, title: 'Auto Feed', desc: 'Save automatically every day, never miss a streak' },
  { icon: <Palette size={18} className="text-purple-400" />, title: 'Piggy Skins', desc: 'Unlock all 5 exclusive piggy bank themes' },
  { icon: <Star size={18} className="text-cyan-400" />, title: 'Bonus XP', desc: '+25% XP on every feed. Level up faster' },
  { icon: <Shield size={18} className="text-emerald-400" />, title: 'Priority support', desc: 'Dedicated support and early feature access' },
  { icon: <Sparkles size={18} className="text-orange-400" />, title: 'Seasonal themes', desc: 'Limited backgrounds & holiday piggy skins' },
];

const plans = [
  { id: 'monthly', label: 'Monthly', price: '$2.99', period: '/mo', tag: null },
  { id: 'yearly', label: 'Yearly', price: '$19.99', period: '/yr', tag: 'Save 44%' },
];

export default function Premium() {
  const navigate = useNavigate();
  const { isPremium, setIsPremium, pigSkin, setPigSkin } = useApp();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [previewSkin, setPreviewSkin] = useState(pigSkin);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    setIsPremium(true);
    setSubscribed(true);
    setTimeout(() => navigate('/home'), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-80 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #F59E0B 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronLeft size={18} className="text-white/60" />
        </button>
        <div>
          <h1 className="text-white" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Premium</h1>
          <p className="text-white/40" style={{ fontSize: 13 }}>Level up your piggy bank</p>
        </div>
        {isPremium && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <Crown size={13} className="text-amber-400" />
            <span className="text-amber-400" style={{ fontWeight: 700, fontSize: 12 }}>Active</span>
          </div>
        )}
      </div>

      {/* Pig skin preview */}
      <div className="flex flex-col items-center mb-6 relative z-10">
        <div className="relative">
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: -20,
              background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            key={previewSkin}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <PiggyBank size={150} skin={previewSkin} pulsing />
          </motion.div>
        </div>
      </div>

      {/* Skin selector */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>Piggy Skins</span>
          {!isPremium && (
            <span className="text-white/35" style={{ fontSize: 12 }}>Unlock with Premium</span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {skins.map(skin => {
            const active = previewSkin === skin.id;
            const unlocked = skin.owned || isPremium;
            return (
              <motion.button
                key={skin.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => { setPreviewSkin(skin.id); if (unlocked) setPigSkin(skin.id); }}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl"
                style={{
                  background: active ? `${skin.color}18` : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${active ? skin.color + '50' : 'rgba(255,255,255,0.07)'}`,
                  minWidth: 72,
                  opacity: !unlocked && !active ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: 22, filter: !unlocked ? 'grayscale(0.5)' : 'none' }}>{skin.emoji}</span>
                <span className="text-white/60" style={{ fontSize: 10, fontWeight: 600 }}>{skin.name}</span>
                {!unlocked && (
                  <span className="text-amber-400" style={{ fontSize: 9, fontWeight: 700 }}>PRO</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-6 relative z-10">
        <div className="text-white mb-3" style={{ fontWeight: 700, fontSize: 15 }}>Everything included</div>
        <div className="space-y-2">
          {premiumBenefits.map(b => (
            <div key={b.title} className="flex items-center gap-3 py-3 px-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                {b.icon}
              </div>
              <div className="flex-1">
                <div className="text-white" style={{ fontWeight: 600, fontSize: 13 }}>{b.title}</div>
                <div className="text-white/35" style={{ fontSize: 12 }}>{b.desc}</div>
              </div>
              <Check size={15} className="text-emerald-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Plan selector */}
      {!isPremium && (
        <div className="relative z-10">
          <div className="flex gap-3 mb-4">
            {plans.map(plan => (
              <motion.button
                key={plan.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedPlan(plan.id)}
                className="flex-1 p-4 rounded-2xl relative"
                style={{
                  background: selectedPlan === plan.id ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${selectedPlan === plan.id ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {plan.tag && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {plan.tag}
                  </div>
                )}
                <div className="text-white/50 mb-1" style={{ fontSize: 12 }}>{plan.label}</div>
                <div className="text-white" style={{ fontWeight: 800, fontSize: 20 }}>{plan.price}</div>
                <div className="text-white/30" style={{ fontSize: 11 }}>{plan.period}</div>
              </motion.button>
            ))}
          </div>

          {/* Subscribe button */}
          <AnimatePresence mode="wait">
            {!subscribed ? (
              <motion.button
                key="subscribe"
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={handleSubscribe}
                className="w-full py-5 rounded-2xl text-white flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                  boxShadow: '0 8px 40px rgba(245,158,11,0.4)',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                <Crown size={18} />
                Unlock Premium
              </motion.button>
            ) : (
              <motion.div
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full py-5 rounded-2xl flex items-center justify-center gap-2"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1.5px solid rgba(34,197,94,0.3)' }}
              >
                <span style={{ fontSize: 20 }}>🎉</span>
                <span className="text-emerald-400" style={{ fontWeight: 700, fontSize: 16 }}>Welcome to Premium!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-white/25 mt-3" style={{ fontSize: 12 }}>
            Cancel anytime · Secure payment · No hidden fees
          </p>
        </div>
      )}
    </div>
  );
}
