import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Check, Gamepad2, Wallet } from 'lucide-react';
import { PiggyBank } from '../components/PiggyBank';
import { useApp } from '../context/AppContext';

const TOTAL_STEPS = 2;

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export default function Onboarding() {
  const navigate = useNavigate();
  const {
    setIsOnboarded,
    authReady,
    privyConfigured,
    authenticated,
    providerKind,
    userName,
    userEmail,
    walletSourceLabel,
    walletStatus,
    walletDeployed,
    walletReadyForTransactions,
    walletError,
    canActivateWallet,
    availableNativeWallets,
    nativeWalletsLoading,
    nativeWalletPendingId,
    loginWith,
    loginWithCartridge,
    connectNativeWallet,
    activateWallet,
  } = useApp();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = async () => {
    if (step === TOTAL_STEPS - 1) {
      if (providerKind === 'privy' && authenticated && !walletReadyForTransactions) {
        return;
      }
      setIsOnboarded(true);
      navigate('/home');
      return;
    }

    if (step === 1 && !authenticated) {
      return;
    }

    if (step === 0 && privyConfigured && !authReady) {
      return;
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

  React.useEffect(() => {
    if (!authenticated || step !== TOTAL_STEPS - 1) {
      return;
    }

    if (providerKind !== 'privy' || walletReadyForTransactions) {
      setIsOnboarded(true);
      navigate('/home');
    }
  }, [authenticated, navigate, providerKind, setIsOnboarded, step, walletReadyForTransactions]);

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
              {['USDC', 'Bitcoin', 'STRK'].map(t => (
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
              <PiggyBank size={24} />
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
              {step === 1 && (
                <StepLogin
                  authReady={authReady}
                  privyConfigured={privyConfigured}
                  authenticated={authenticated}
                  providerKind={providerKind}
                  userName={userName}
                  userEmail={userEmail}
                  walletSourceLabel={walletSourceLabel}
                  nativeWalletsLoading={nativeWalletsLoading}
                  availableNativeWallets={availableNativeWallets}
                  walletError={walletError}
                  walletStatus={walletStatus}
                  walletDeployed={walletDeployed}
                  walletReadyForTransactions={walletReadyForTransactions}
                  nativeWalletPendingId={nativeWalletPendingId}
                  canActivateWallet={canActivateWallet}
                  onActivateWallet={activateWallet}
                  onLogin={loginWith}
                  onLoginWithCartridge={loginWithCartridge}
                  onConnectNativeWallet={connectNativeWallet}
                  onNext={goNext}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Back button */}
          {step > 0 && (
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
          { title: 'One daily action', desc: 'Feed your piggy in one tap' },
          { title: 'Build streaks', desc: 'Earn XP, badges and rewards' },
          { title: 'Your savings, your keys', desc: 'Non-custodial on Starknet' },
        ].map(item => (
          <div key={item.title} className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span
              className="block w-2.5 h-2.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)' }}
            />
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
function StepLogin({
  authReady,
  privyConfigured,
  authenticated,
  providerKind,
  userName,
  userEmail,
  walletSourceLabel,
  nativeWalletsLoading,
  availableNativeWallets,
  walletStatus,
  walletDeployed,
  walletReadyForTransactions,
  nativeWalletPendingId,
  canActivateWallet,
  walletError,
  onActivateWallet,
  onLogin,
  onLoginWithCartridge,
  onConnectNativeWallet,
  onNext,
}: {
  authReady: boolean;
  privyConfigured: boolean;
  authenticated: boolean;
  providerKind: 'privy' | 'cartridge' | 'native' | null;
  userName: string;
  userEmail: string | null;
  walletSourceLabel: string;
  nativeWalletsLoading: boolean;
  availableNativeWallets: { id: string; name: string; icon: string }[];
  walletStatus: string;
  walletDeployed: boolean | null;
  walletReadyForTransactions: boolean;
  nativeWalletPendingId: string | null;
  canActivateWallet: boolean;
  walletError: string | null;
  onActivateWallet: () => Promise<boolean>;
  onLogin: (method: 'google') => Promise<void>;
  onLoginWithCartridge: () => Promise<void>;
  onConnectNativeWallet: (walletId: string) => Promise<void>;
  onNext: () => void;
}) {
  const needsPrivyActivation =
    authenticated &&
    providerKind === 'privy' &&
    walletDeployed === false &&
    !walletReadyForTransactions;

  return (
    <div className="flex flex-col">
      <h2 className="text-white mb-2" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
        Create your account
      </h2>
      <p className="text-white/45 mb-10" style={{ fontSize: 14 }}>
        No crypto knowledge needed. Sign in in seconds.
      </p>

      {!authenticated ? (
        <>
          <div className="mb-4 text-white/35" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Social login
          </div>
          <div className="space-y-3 mb-8">
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
              onClick={() => onLogin('google')}
              disabled={!privyConfigured || !authReady}
            />
          </div>

          {!privyConfigured && (
            <div
              className="mb-6 p-4 rounded-2xl"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              <div className="text-amber-400" style={{ fontWeight: 700, fontSize: 13 }}>
                Social login disabled
              </div>
              <div className="text-white/45 mt-1" style={{ fontSize: 12, lineHeight: 1.6 }}>
                If Privy is not configured, you can still continue with Cartridge or a native Starknet wallet.
              </div>
            </div>
          )}

          <div className="mb-4 text-white/35" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Game wallet
          </div>
          <div className="space-y-3 mb-8">
            <SocialButton
              icon={<Gamepad2 size={20} className="text-orange-400" />}
              label="Continue with Cartridge"
              onClick={onLoginWithCartridge}
              accent
            />
          </div>

          <div className="mb-4 text-white/35" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Native Starknet wallet
          </div>
          <div className="space-y-3 mb-8">
            {availableNativeWallets.map((wallet) => (
              <WalletButton
                key={wallet.id}
                label={
                  nativeWalletPendingId === wallet.id
                    ? `Connecting ${wallet.name}...`
                    : `Connect ${wallet.name}`
                }
                icon={wallet.icon}
                onClick={() => onConnectNativeWallet(wallet.id)}
                disabled={Boolean(nativeWalletPendingId)}
                pending={nativeWalletPendingId === wallet.id}
              />
            ))}
            {!availableNativeWallets.length && (
              <div
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-3">
                  <Wallet size={18} className="text-white/45" />
                  <div className="text-left">
                    <div className="text-white/70" style={{ fontWeight: 600, fontSize: 13 }}>
                      {nativeWalletsLoading ? 'Scanning installed wallets...' : 'No wallet found'}
                    </div>
                    <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.5 }}>
                      Braavos, Ready, and other Starknet wallet extensions will appear here.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div
          className="mb-6 p-4 rounded-2xl"
          style={{
            background: needsPrivyActivation
              ? 'rgba(251,191,36,0.08)'
              : 'rgba(34,197,94,0.08)',
            border: needsPrivyActivation
              ? '1px solid rgba(251,191,36,0.2)'
              : '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div
                className={needsPrivyActivation ? 'text-amber-400' : 'text-emerald-400'}
                style={{ fontWeight: 700, fontSize: 14 }}
              >
                {needsPrivyActivation ? 'Wallet activation required' : userName || 'Account connected'}
              </div>
              <div className="text-white/45" style={{ fontSize: 12 }}>
                {needsPrivyActivation
                  ? walletStatus === 'activating'
                    ? 'Waiting for Starknet deploy confirmation.'
                    : 'Your Starknet account exists in Privy but is not yet deployed onchain.'
                  : providerKind === 'privy'
                    ? userEmail ?? `${walletSourceLabel} session active`
                    : `${walletSourceLabel} connected`}
              </div>
            </div>
            {needsPrivyActivation ? null : <Check size={18} className="text-emerald-400" />}
          </div>

          {walletError ? (
            <div
              className="mb-4 p-3 rounded-xl"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <div className="text-red-300" style={{ fontSize: 12, lineHeight: 1.6 }}>
                {walletError}
              </div>
            </div>
          ) : null}

          {needsPrivyActivation ? (
            <div className="space-y-3">
              <PrimaryButton
                onClick={() => {
                  void onActivateWallet();
                }}
                label={
                  walletStatus === 'activating'
                    ? 'Activating Starknet wallet...'
                    : 'Activate Starknet wallet'
                }
                disabled={!canActivateWallet || walletStatus === 'activating'}
              />
              <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.6 }}>
                Activation is only required for undeployed social wallets. Native and Cartridge wallets skip this step.
              </div>
            </div>
          ) : (
            <PrimaryButton onClick={onNext} label="Enter PocketPig" />
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Shared: Primary Button ---- */
function PrimaryButton({
  onClick,
  label,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-2xl text-white flex items-center justify-center gap-2"
      style={{
        background: disabled
          ? 'rgba(255,255,255,0.08)'
          : 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
        boxShadow: disabled ? 'none' : '0 8px 32px rgba(249,115,22,0.35)',
        fontWeight: 700,
        fontSize: 16,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
      <ChevronRight size={18} />
    </motion.button>
  );
}

/* ---- Shared: Social Button ---- */
function SocialButton({
  icon,
  label,
  onClick,
  accent = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-4 p-4 rounded-2xl"
      style={{
        background: disabled
          ? 'rgba(255,255,255,0.03)'
          : accent
            ? 'rgba(251,191,36,0.08)'
            : 'rgba(255,255,255,0.05)',
        border: `1px solid ${
          disabled
            ? 'rgba(255,255,255,0.05)'
            : accent
              ? 'rgba(251,191,36,0.25)'
              : 'rgba(255,255,255,0.1)'
        }`,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
      <span className="text-white flex-1 text-left" style={{ fontWeight: 600, fontSize: 15 }}>{label}</span>
      <ChevronRight size={16} className="text-white/30" />
    </motion.button>
  );
}

function WalletButton({
  label,
  icon,
  onClick,
  disabled = false,
  pending = false,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-4 p-4 rounded-2xl"
      style={{
        background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        {icon ? (
          <img src={icon} alt="" className="w-5 h-5 object-contain" />
        ) : (
          <Wallet size={18} className="text-white/60" />
        )}
      </div>
      <span className="text-white flex-1 text-left" style={{ fontWeight: 600, fontSize: 15 }}>
        {label}
      </span>
      {pending ? (
        <span className="text-orange-400" style={{ fontSize: 12, fontWeight: 700 }}>
          Waiting...
        </span>
      ) : (
        <ChevronRight size={16} className="text-white/30" />
      )}
    </motion.button>
  );
}
