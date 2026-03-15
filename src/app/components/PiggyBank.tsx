import React, { useId } from 'react';
import { motion } from 'motion/react';

interface PiggyBankProps {
  size?: number;
  happy?: boolean;
  pulsing?: boolean;
  skin?: string;
  className?: string;
}

export const PiggyBank: React.FC<PiggyBankProps> = ({
  size = 200,
  happy = false,
  pulsing = false,
  skin = 'classic',
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const skinColors: Record<string, { body: string[]; accent: string; snout: string }> = {
    classic: {
      body: ['#FCD34D', '#F97316', '#C2410C'],
      accent: '#EA580C',
      snout: '#FED7AA',
    },
    midnight: {
      body: ['#818CF8', '#6366F1', '#4338CA'],
      accent: '#4F46E5',
      snout: '#C7D2FE',
    },
    emerald: {
      body: ['#6EE7B7', '#10B981', '#047857'],
      accent: '#059669',
      snout: '#A7F3D0',
    },
    rose: {
      body: ['#FDA4AF', '#F43F5E', '#BE123C'],
      accent: '#E11D48',
      snout: '#FFE4E6',
    },
    golden: {
      body: ['#FDE68A', '#F59E0B', '#B45309'],
      accent: '#D97706',
      snout: '#FEF3C7',
    },
  };

  const colors = skinColors[skin] || skinColors.classic;

  return (
    <motion.div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size }}
      animate={pulsing ? {
        scale: [1, 1.03, 1],
        filter: ['drop-shadow(0 0 20px rgba(249,115,22,0.4))', 'drop-shadow(0 0 35px rgba(249,115,22,0.7))', 'drop-shadow(0 0 20px rgba(249,115,22,0.4))'],
      } : {}}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        viewBox="0 0 280 280"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Body gradient */}
          <radialGradient id={`pigBodyGrad-${uid}`} cx="32%" cy="28%" r="68%">
            <stop offset="0%" stopColor={colors.body[0]} />
            <stop offset="50%" stopColor={colors.body[1]} />
            <stop offset="100%" stopColor={colors.body[2]} />
          </radialGradient>

          {/* Head gradient */}
          <radialGradient id={`pigHeadGrad-${uid}`} cx="30%" cy="28%" r="72%">
            <stop offset="0%" stopColor={colors.body[0]} />
            <stop offset="55%" stopColor={colors.body[1]} />
            <stop offset="100%" stopColor={colors.body[2]} />
          </radialGradient>

          {/* Ear gradient */}
          <radialGradient id={`earGrad-${uid}`} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor={colors.body[0]} />
            <stop offset="100%" stopColor={colors.accent} />
          </radialGradient>

          {/* Snout gradient */}
          <radialGradient id={`snoutGrad-${uid}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors.snout} />
          </radialGradient>

          {/* Eye gradient */}
          <radialGradient id="eyeGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>

          {/* Coin glow filter */}
          <filter id={`coinGlow-${uid}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Body glow */}
          <filter id={`bodyGlow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="16" floodColor={colors.body[1]} floodOpacity="0.45" />
          </filter>

          {/* Shadow below */}
          <filter id={`pigShadow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor={colors.body[2]} floodOpacity="0.3" />
          </filter>

          {/* Soft blush */}
          <radialGradient id="blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCA5A5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground glow */}
        <ellipse cx="140" cy="258" rx="88" ry="14" fill={colors.body[1]} opacity="0.18" />
        <ellipse cx="140" cy="254" rx="56" ry="8" fill={colors.body[1]} opacity="0.12" />

        {/* Tail */}
        <path
          d="M 228 180 C 248 166, 258 182, 244 194 S 225 208, 240 222"
          stroke={colors.accent}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        {/* Legs */}
        <rect x="62" y="222" width="30" height="36" rx="15" fill={colors.body[1]} />
        <rect x="98" y="228" width="30" height="36" rx="15" fill={colors.accent} />
        <rect x="140" y="228" width="30" height="36" rx="15" fill={colors.accent} />
        <rect x="176" y="222" width="30" height="36" rx="15" fill={colors.body[1]} />

        {/* Leg highlights */}
        <rect x="68" y="224" width="12" height="8" rx="6" fill="white" opacity="0.15" />
        <rect x="182" y="224" width="12" height="8" rx="6" fill="white" opacity="0.15" />

        {/* Body */}
        <ellipse cx="140" cy="192" rx="105" ry="70" fill={`url(#pigBodyGrad-${uid})`} filter={`url(#pigShadow-${uid})`} />

        {/* Body highlight */}
        <ellipse cx="118" cy="170" rx="52" ry="30" fill="white" opacity="0.09" />
        <ellipse cx="108" cy="162" rx="22" ry="14" fill="white" opacity="0.07" />

        {/* Ears (behind head) */}
        {/* Left ear */}
        <ellipse cx="74" cy="52" rx="26" ry="34" transform="rotate(-18 74 52)" fill={`url(#earGrad-${uid})`} />
        <ellipse cx="74" cy="54" rx="15" ry="21" transform="rotate(-18 74 54)" fill={colors.snout} opacity="0.75" />

        {/* Right ear */}
        <ellipse cx="206" cy="52" rx="26" ry="34" transform="rotate(18 206 52)" fill={`url(#earGrad-${uid})`} />
        <ellipse cx="206" cy="54" rx="15" ry="21" transform="rotate(18 206 54)" fill={colors.snout} opacity="0.75" />

        {/* Head */}
        <circle cx="140" cy="115" r="74" fill={`url(#pigHeadGrad-${uid})`} filter={`url(#bodyGlow-${uid})`} />

        {/* Head highlight */}
        <ellipse cx="118" cy="88" rx="38" ry="26" fill="white" opacity="0.12" />

        {/* Coin slot shadow/base */}
        <rect x="120" y="44" width="40" height="12" rx="6" fill="#1C1917" />
        {/* Coin slot glow ring */}
        <rect x="118" y="42" width="44" height="16" rx="8" fill="#F59E0B" opacity="0.35" filter={`url(#coinGlow-${uid})`} />
        {/* Coin slot bright */}
        <rect x="120" y="44" width="40" height="12" rx="6" fill="#F59E0B" opacity="0.85" filter={`url(#coinGlow-${uid})`} />
        {/* Coin slot dark slit */}
        <rect x="122" y="47" width="36" height="6" rx="3" fill="#1C1917" />
        {/* Slot inner shine */}
        <rect x="124" y="48" width="12" height="2" rx="1" fill="#F59E0B" opacity="0.5" />

        {/* Left eye */}
        <circle cx="112" cy="102" r="12" fill="url(#eyeGrad)" />
        {/* Left eye main shine */}
        <circle cx="116" cy="98" r="5" fill="white" opacity="0.9" />
        {/* Left eye small shine */}
        <circle cx="108" cy="107" r="2" fill="white" opacity="0.35" />

        {/* Right eye */}
        <circle cx="168" cy="102" r="12" fill="url(#eyeGrad)" />
        {/* Right eye main shine */}
        <circle cx="172" cy="98" r="5" fill="white" opacity="0.9" />
        {/* Right eye small shine */}
        <circle cx="164" cy="107" r="2" fill="white" opacity="0.35" />

        {/* Happy eyes (curved) — shown when happy */}
        {happy && (
          <>
            <path d="M 103 100 Q 112 92 121 100" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
            <path d="M 159 100 Q 168 92 177 100" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
          </>
        )}

        {/* Cheek blush - left */}
        <ellipse cx="90" cy="124" rx="20" ry="14" fill="url(#blush)" />
        {/* Cheek blush - right */}
        <ellipse cx="190" cy="124" rx="20" ry="14" fill="url(#blush)" />

        {/* Snout */}
        <ellipse cx="140" cy="133" rx="33" ry="24" fill={`url(#snoutGrad-${uid})`} />
        {/* Snout highlight */}
        <ellipse cx="132" cy="126" rx="12" ry="8" fill="white" opacity="0.22" />

        {/* Nostrils */}
        <ellipse cx="130" cy="136" rx="6" ry="4.5" fill={colors.accent} opacity="0.4" />
        <ellipse cx="150" cy="136" rx="6" ry="4.5" fill={colors.accent} opacity="0.4" />
        <ellipse cx="130" cy="136" rx="4" ry="3" fill={colors.body[2]} opacity="0.5" />
        <ellipse cx="150" cy="136" rx="4" ry="3" fill={colors.body[2]} opacity="0.5" />

        {/* Smile */}
        <path
          d={happy ? "M 124 152 Q 140 165 156 152" : "M 126 152 Q 140 160 154 152"}
          stroke={colors.body[2]}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.65"
        />
      </svg>
    </motion.div>
  );
};

/* Floating coin animation component */
export const FloatingCoin: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      initial={{ opacity: 0, x: '50vw', y: '58vh', scale: 0.75 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x:
          typeof window !== 'undefined' && window.innerWidth >= 1024
            ? ['50vw', '38vw', '24vw', '11vw']
            : ['50vw', '54vw', '50vw'],
        y:
          typeof window !== 'undefined' && window.innerWidth >= 1024
            ? ['58vh', '44vh', '26vh', '18vh']
            : ['58vh', '46vh', '32vh'],
        scale: [0.8, 1, 0.92, 0.7],
      }}
      transition={{ duration: 1.1, ease: 'easeInOut' }}
      style={{ top: 0, left: 0 }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
          boxShadow: '0 0 18px rgba(249,115,22,0.45)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      />
    </motion.div>
  );
};

/* XP Float animation */
export const XPFloat: React.FC<{ visible: boolean; amount?: number }> = ({ visible, amount = 50 }) => {
  if (!visible) return null;
  return (
    <motion.div
      className="absolute pointer-events-none z-50 font-bold text-amber-400"
      style={{ fontSize: 18, top: '30%', left: '52%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 1, y: 0, scale: 0.8 }}
      animate={{ opacity: 0, y: -90, scale: 1.1 }}
      transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
    >
      +{amount} XP
    </motion.div>
  );
};
