import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Shield,
  Bitcoin,
  Sprout,
  Gem,
  Flame,
  Zap,
  Settings,
  Wallet,
  RefreshCw,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { PiggyBank, FloatingCoin } from '../components/PiggyBank';
import { useApp, type SavingMode } from '../context/AppContext';
import { appEnv } from '../../lib/env';
import { getPocketPigAssetUsdPrice } from '../../lib/onchain';

const modeConfig = {
  safe: {
    label: 'USDC',
    icon: Shield,
    color: '#22D3EE',
    action: 'Supply USDC',
  },
  bitcoin: {
    label: 'Bitcoin',
    icon: Bitcoin,
    color: '#FBBF24',
    action: 'Stake BTC',
  },
  eth: {
    label: 'ETH',
    icon: Gem,
    color: '#A78BFA',
    action: 'Supply ETH',
  },
  grow: {
    label: 'STRK',
    icon: Sprout,
    color: '#34D399',
    action: 'Stake STRK',
  },
};

function formatBitcoinAmount(value: number) {
  return value.toFixed(8).replace(/\.?0+$/, '');
}

function formatUsdcAmount(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function resolveRateStatus(params: {
  marketLoading: boolean;
  marketError: string | null;
  hasRate: boolean;
}) {
  if (params.hasRate) {
    return null;
  }

  if (params.marketLoading) {
    return {
      title: 'Loading rate...',
      subtitle: 'Fetching live yield',
    };
  }

  if (params.marketError) {
    return {
      title: 'Backend offline',
      subtitle: 'Start `npm run server:dev`',
    };
  }

  return {
    title: 'Rate unavailable',
    subtitle: 'Yield feed not ready',
  };
}

function formatCompactAmount(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits,
  }).format(value);
}

function formatPresetAmount(mode: SavingMode, value: number) {
  if (mode === 'grow') {
    return `${value.toFixed(4).replace(/\.?0+$/, '')} STRK`;
  }

  if (mode === 'bitcoin') {
    return `${value.toFixed(8).replace(/\.?0+$/, '')} WBTC`;
  }

  if (mode === 'eth') {
    return `${value.toFixed(6).replace(/\.?0+$/, '')} ETH`;
  }

  return `${value.toFixed(2).replace(/\.?0+$/, '')} USDC`;
}

function InfoChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'error';
}) {
  return (
    <div
      className="rounded-full px-3 py-1.5"
      style={{
        background:
          tone === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
        border:
          tone === 'error'
            ? '1px solid rgba(239,68,68,0.2)'
            : '1px solid rgba(255,255,255,0.07)',
        color: tone === 'error' ? '#FCA5A5' : 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
}

export default function Home() {
  const {
    mode,
    setMode,
    dailyAmount,
    setDailyAmount,
    targetUsdAmount,
    setTargetUsdAmount,
    ethAmount,
    setEthAmount,
    bitcoinAmount,
    setBitcoinAmount,
    streak,
    xp,
    level,
    feed,
    feedPending,
    feedError,
    lastTransactionHash,
    lastTransactionLabel,
    balances,
    balancesLoading,
    balancesError,
    refreshBalances,
    feedPreview,
    feedPreviewLoading,
    feedPreviewError,
    marketOverview,
    marketLoading,
    marketError,
    walletStatus,
    walletReadyForTransactions,
    walletError,
    canActivateWallet,
    activateWallet,
  } = useApp();
  const [showCoin, setShowCoin] = useState(false);
  const [pigHappy, setPigHappy] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [showWalletSheet, setShowWalletSheet] = useState(false);
  const [assetUsdPrices, setAssetUsdPrices] = useState<Record<SavingMode, number>>({
    safe: 1,
    bitcoin: 0,
    eth: 0,
    grow: 0,
  });
  const [growInput, setGrowInput] = useState(() => String(dailyAmount));
  const [ethInput, setEthInput] = useState(() => String(ethAmount));
  const [bitcoinInput, setBitcoinInput] = useState(() => formatBitcoinAmount(bitcoinAmount));
  const [usdcInput, setUsdcInput] = useState(() => formatUsdcAmount(targetUsdAmount));

  const cfg = modeConfig[mode];
  const ModeIcon = cfg.icon;
  const explorerBaseUrl =
    appEnv.starkzapNetwork === 'mainnet'
      ? 'https://voyager.online/tx/'
      : 'https://sepolia.voyager.online/tx/';

  const handleFeed = async () => {
    if (feeding || feedPending || !walletReadyForTransactions) return;
    setFeeding(true);

    const success = await feed();

    if (success) {
      setShowCoin(true);
      setPigHappy(true);
      setTimeout(() => {
        setShowCoin(false);
      }, 1600);
      setTimeout(() => {
        setPigHappy(false);
      }, 1800);
    }

    setFeeding(false);
  };

  const controlValue =
    mode === 'grow'
      ? `${dailyAmount} STRK`
      : mode === 'eth'
        ? `${ethInput.trim() === '' ? formatPresetAmount('eth', ethAmount).replace(' ETH', '') : ethInput} ETH`
      : mode === 'bitcoin'
        ? `${formatBitcoinAmount(bitcoinAmount)} WBTC`
        : `${formatUsdcAmount(targetUsdAmount)} USDC`;
  const ctaLabel =
    mode === 'grow'
      ? `${dailyAmount} STRK`
      : mode === 'eth'
        ? `${formatPresetAmount('eth', ethAmount)}`
      : mode === 'bitcoin'
        ? `${formatBitcoinAmount(bitcoinAmount)} WBTC`
        : `${formatUsdcAmount(targetUsdAmount)} USDC`;
  const compactSubtitle =
    mode === 'grow'
      ? 'Direct native staking'
      : mode === 'eth'
        ? 'Direct Vesu ETH supply'
      : mode === 'bitcoin'
        ? 'Direct BTC staking'
        : 'Direct Vesu supply';
  const compactUnitLabel =
    mode === 'grow' ? 'STRK' : mode === 'bitcoin' ? 'WBTC' : mode === 'eth' ? 'ETH' : 'USDC';
  const activeAssetUsdPrice =
    (() => {
      const previewPrice =
        mode === 'grow'
          ? Number(feedPreview?.usdValue ?? 0) > 0 && dailyAmount > 0
            ? Number(feedPreview?.usdValue ?? 0) / dailyAmount
            : 0
          : mode === 'eth'
            ? Number(feedPreview?.usdValue ?? 0) > 0 && ethAmount > 0
              ? Number(feedPreview?.usdValue ?? 0) / ethAmount
              : 0
            : mode === 'bitcoin'
              ? Number(feedPreview?.usdValue ?? 0) > 0 && bitcoinAmount > 0
                ? Number(feedPreview?.usdValue ?? 0) / bitcoinAmount
                : 0
              : 1;

      return previewPrice > 0 ? previewPrice : assetUsdPrices[mode];
    })();
  const dollarPresets = [1, 5, 10, 25, 100];

  const applyDollarPreset = (usdAmount: number) => {
    if (mode === 'safe') {
      setTargetUsdAmount(Number(usdAmount.toFixed(2)));
      return;
    }

    if (activeAssetUsdPrice <= 0) {
      return;
    }

    const tokenAmount = usdAmount / activeAssetUsdPrice;
    if (mode === 'grow') {
      setDailyAmount(Number(tokenAmount.toFixed(4)));
      return;
    }

    if (mode === 'eth') {
      setEthAmount(Number(tokenAmount.toFixed(6)));
      return;
    }

    setBitcoinAmount(Number(tokenAmount.toFixed(8)));
  };

  useEffect(() => {
    setGrowInput(String(dailyAmount));
  }, [dailyAmount]);

  useEffect(() => {
    setEthInput(String(ethAmount));
  }, [ethAmount]);

  useEffect(() => {
    setBitcoinInput(formatBitcoinAmount(bitcoinAmount));
  }, [bitcoinAmount]);

  useEffect(() => {
    setUsdcInput(formatUsdcAmount(targetUsdAmount));
  }, [targetUsdAmount]);

  useEffect(() => {
    let cancelled = false;

    const refreshPrices = async () => {
      const modes: SavingMode[] = ['grow', 'bitcoin', 'eth'];
      const results = await Promise.allSettled(
        modes.map(async (item) => [item, await getPocketPigAssetUsdPrice(item)] as const),
      );

      if (cancelled) {
        return;
      }

      setAssetUsdPrices((current) => {
        const next = { ...current };
        for (const result of results) {
          if (result.status !== 'fulfilled') {
            continue;
          }

          const [item, price] = result.value;
          if (price && price > 0) {
            next[item] = price;
          }
        }
        return next;
      });
    };

    void refreshPrices();
    const intervalId = window.setInterval(() => {
      void refreshPrices();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const commitGrowInput = () => {
    const parsed = Number(growInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setGrowInput(String(dailyAmount));
      return;
    }
    setDailyAmount(parsed);
  };

  const commitEthInput = () => {
    const parsed = Number(ethInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setEthInput(String(ethAmount));
      return;
    }
    setEthAmount(parsed);
  };

  const commitBitcoinInput = () => {
    const parsed = Number(bitcoinInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setBitcoinInput(formatBitcoinAmount(bitcoinAmount));
      return;
    }
    setBitcoinAmount(parsed);
  };

  const commitUsdcInput = () => {
    const parsed = Number(usdcInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setUsdcInput(formatUsdcAmount(targetUsdAmount));
      return;
    }
    setTargetUsdAmount(parsed);
  };

  const handleGrowInputChange = (value: string) => {
    setGrowInput(value);
    if (value.trim() === '') {
      return;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      setDailyAmount(parsed);
    }
  };

  const handleBitcoinInputChange = (value: string) => {
    setBitcoinInput(value);
    if (value.trim() === '') {
      return;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      setBitcoinAmount(parsed);
    }
  };

  const handleEthInputChange = (value: string) => {
    setEthInput(value);
    if (value.trim() === '') {
      return;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      setEthAmount(parsed);
    }
  };

  const handleUsdcInputChange = (value: string) => {
    setUsdcInput(value);
    if (value.trim() === '') {
      return;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      setTargetUsdAmount(parsed);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6 relative overflow-hidden lg:px-8">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)', top: '8%' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #FBBF24 0%, transparent 70%)' }}
        />
      </div>

      <div className="flex items-center justify-between mb-5 relative z-10 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.22)' }}
          >
            <Flame size={13} className="text-orange-400" />
            <span className="text-orange-300" style={{ fontWeight: 700, fontSize: 12 }}>
              {streak}d
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}
          >
            <Zap size={13} className="text-amber-400" />
            <span className="text-amber-300" style={{ fontWeight: 700, fontSize: 12 }}>
              {xp.toLocaleString()} XP
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}
          >
            <Zap size={13} className="text-amber-400" />
            <span className="text-amber-400" style={{ fontWeight: 700, fontSize: 12 }}>
              Lv {level}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWalletSheet(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Wallet size={16} className="text-white/60" />
          </button>
          <Link to="/profile">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Settings size={16} className="text-white/60" />
            </div>
          </Link>
        </div>
      </div>

      <div
        className="mb-4 px-3 py-3 rounded-2xl relative z-10"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-white/60" style={{ fontWeight: 700, fontSize: 12 }}>
              Pool totals
            </div>
            <div className="text-white/30" style={{ fontSize: 11 }}>
              All tracked app positions
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <HeaderMetric
              label="STRK"
              value={marketOverview ? formatCompactAmount(marketOverview.totals.strkAmount, 2) : '0'}
              color="#34D399"
            />
            <HeaderMetric
              label="BTC"
              value={marketOverview ? formatBitcoinAmount(marketOverview.totals.btcAmount) : '0'}
              color="#FBBF24"
            />
            <HeaderMetric
              label="ETH"
              value={marketOverview ? formatCompactAmount(marketOverview.totals.ethAmount, 4) : '0'}
              color="#A78BFA"
            />
            <HeaderMetric
              label="USDC"
              value={marketOverview ? formatCompactAmount(marketOverview.totals.usdcAmount, 2) : '0'}
              color="#22D3EE"
            />
          </div>
        </div>
      </div>

      <div
        className="mb-4 p-4 rounded-2xl relative z-10"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/70" style={{ fontWeight: 700, fontSize: 13 }}>
              Asset
            </div>
            <div className="text-white/35" style={{ fontSize: 12 }}>
              Switch without leaving home
            </div>
          </div>
          <div
            className="rounded-full px-3 py-1.5 flex items-center gap-2"
            style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}33` }}
          >
            <ModeIcon size={14} style={{ color: cfg.color }} />
            <span style={{ color: cfg.color, fontSize: 12, fontWeight: 700 }}>{cfg.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(Object.entries(modeConfig) as [SavingMode, (typeof modeConfig)['safe']][]).map(
            ([id, entry]) => {
              const EntryIcon = entry.icon;
              const active = mode === id;
              const liveRate = marketOverview?.rates[id] ?? null;
              const rateStatus = resolveRateStatus({
                hasRate: Boolean(liveRate),
                marketLoading,
                marketError,
              });
              return (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className="rounded-2xl px-3 py-3 text-left"
                  style={{
                    background: active ? `${entry.color}12` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${entry.color}55` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <EntryIcon size={15} style={{ color: active ? entry.color : 'rgba(255,255,255,0.35)' }} />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: active ? entry.color : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {entry.label}
                    </span>
                  </div>
                  <div
                    className="mt-2"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: active
                        ? entry.color
                        : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {liveRate && activeAssetUsdPrice > 0 && id === mode
                      ? `$1 = ${formatPresetAmount(id, 1 / activeAssetUsdPrice)}`
                      : rateStatus?.title ?? '$ presets ready'}
                  </div>
                </button>
              );
            },
          )}
        </div>

      </div>

      <div
        className="mb-4 p-4 rounded-2xl relative z-10"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-white/70" style={{ fontWeight: 700, fontSize: 13 }}>
              {mode === 'grow'
                ? 'STRK amount'
                : mode === 'bitcoin'
                  ? 'BTC amount'
                  : mode === 'eth'
                    ? 'ETH amount'
                    : 'USDC amount'}
            </div>
            <div className="text-white/35" style={{ fontSize: 12 }}>
              {compactSubtitle}
            </div>
          </div>
          <div className="rounded-full px-3 py-1.5 text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {controlValue}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() =>
              mode === 'grow'
                ? setDailyAmount(Number(Math.max(0, dailyAmount - 0.5).toFixed(1)))
                  : mode === 'eth'
                  ? setEthAmount(Number(Math.max(0, ethAmount - 0.01).toFixed(6)))
                : mode === 'bitcoin'
                  ? setBitcoinAmount(Number(Math.max(0, bitcoinAmount - 0.0001).toFixed(8)))
                  : setTargetUsdAmount(Number(Math.max(0, targetUsdAmount - 1).toFixed(2)))
            }
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <Minus size={14} className="text-white/65" />
          </button>
          <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {mode === 'grow' ? (
              <input
                type="number"
                min={0}
                step={0.1}
                value={growInput}
                onChange={(event) => handleGrowInputChange(event.target.value)}
                onBlur={commitGrowInput}
                className="w-full bg-transparent text-white outline-none"
                style={{ fontWeight: 800, fontSize: 18 }}
              />
            ) : mode === 'eth' ? (
              <input
                type="number"
                min={0}
                step={0.000001}
                value={ethInput}
                onChange={(event) => handleEthInputChange(event.target.value)}
                onBlur={commitEthInput}
                className="w-full bg-transparent text-white outline-none"
                style={{ fontWeight: 800, fontSize: 18 }}
              />
            ) : mode === 'bitcoin' ? (
              <input
                type="number"
                min={0}
                step={0.00000001}
                value={bitcoinInput}
                onChange={(event) => handleBitcoinInputChange(event.target.value)}
                onBlur={commitBitcoinInput}
                className="w-full bg-transparent text-white outline-none"
                style={{ fontWeight: 800, fontSize: 18 }}
              />
            ) : (
              <input
                type="number"
                min={0}
                step={0.01}
                value={usdcInput}
                onChange={(event) => handleUsdcInputChange(event.target.value)}
                onBlur={commitUsdcInput}
                className="w-full bg-transparent text-white outline-none"
                style={{ fontWeight: 800, fontSize: 18 }}
              />
            )}
            <div className="mt-1 flex items-center gap-2 text-white/35" style={{ fontSize: 11 }}>
              <span>{compactUnitLabel}</span>
              {feedPreviewLoading && <span>Updating...</span>}
            </div>
        </div>
          <button
            onClick={() =>
              mode === 'grow'
                ? setDailyAmount(Number((dailyAmount + 0.5).toFixed(1)))
                : mode === 'eth'
                  ? setEthAmount(Number((ethAmount + 0.01).toFixed(6)))
                : mode === 'bitcoin'
                  ? setBitcoinAmount(Number((bitcoinAmount + 0.0001).toFixed(8)))
                : setTargetUsdAmount(Number((targetUsdAmount + 1).toFixed(2)))
            }
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(249,115,22,0.15)' }}
          >
            <Plus size={14} className="text-orange-400" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {dollarPresets.map((usdAmount) => (
            <button
              key={usdAmount}
              onClick={() => applyDollarPreset(usdAmount)}
              className="rounded-full px-3 py-1.5"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.78)',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              ${usdAmount}
            </button>
          ))}
          {feedPreview?.feeBps ? (
            <InfoChip
              label={`Fee ${(feedPreview.feeBps / 100).toFixed(2)}%${feedPreview.feeAmountDisplay ? ` • ${feedPreview.feeAmountDisplay} ${compactUnitLabel}` : ''}`}
            />
          ) : null}
          {feedPreview?.targetAmountDisplay ? (
            <InfoChip label={`Net ${feedPreview.targetAmountDisplay} ${compactUnitLabel}`} />
          ) : null}
          {feedPreviewError && <InfoChip label={feedPreviewError} tone="error" />}
        </div>
      </div>

      {(walletStatus === 'needs_backend' || walletStatus === 'error') && (
        <div
          className="mb-4 p-4 rounded-2xl relative z-10"
          style={{
            background:
              walletStatus === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
            border:
              walletStatus === 'error'
                ? '1px solid rgba(239,68,68,0.2)'
                : '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <div style={{ color: walletStatus === 'error' ? '#FCA5A5' : '#FBBF24', fontWeight: 700, fontSize: 13 }}>
            {walletStatus === 'error' ? 'Wallet activation failed' : 'Wallet activation pending'}
          </div>
          <div className="text-white/45 mt-1" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {walletError ?? 'Your Privy session is ready. A backend resolve endpoint is required for wallet activation.'}
          </div>
        </div>
      )}

      {!walletReadyForTransactions && canActivateWallet && (
        <div
          className="mb-4 p-4 rounded-2xl relative z-10"
          style={{
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <div style={{ color: '#FBBF24', fontWeight: 700, fontSize: 13 }}>
            Starknet wallet activation required
          </div>
          <div className="text-white/45 mt-1" style={{ fontSize: 12, lineHeight: 1.6 }}>
            A Privy wallet created with Google must be deployed once before feed and DCA actions can be used.
          </div>
          <button
            onClick={() => void activateWallet()}
            className="mt-3 rounded-xl px-3 py-2 text-white"
            style={{
              background: 'rgba(249,115,22,0.14)',
              border: '1px solid rgba(249,115,22,0.28)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {walletStatus === 'activating' ? 'Activating wallet...' : 'Activate Starknet wallet'}
          </button>
        </div>
      )}

      {feedError && (
        <div
          className="mb-4 p-4 rounded-2xl relative z-10"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="text-red-300" style={{ fontWeight: 700, fontSize: 13 }}>
            Feed transaction failed
          </div>
          <div className="text-white/45 mt-1" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {feedError}
          </div>
        </div>
      )}

      {lastTransactionHash && (
        <div
          className="mb-4 p-4 rounded-2xl relative z-10"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <div className="text-emerald-400" style={{ fontWeight: 700, fontSize: 13 }}>
            Onchain feed completed
          </div>
          <div className="text-white/45 mt-1" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {lastTransactionLabel}
          </div>
          <a
            href={`${explorerBaseUrl}${lastTransactionHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-emerald-400"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            View transaction
          </a>
        </div>
      )}

      <div className="relative flex items-center justify-center mt-1 mb-6 z-10 lg:hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 230,
            height: 230,
            background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          animate={
            feeding
              ? {
                  rotate: [0, -7, 7, -4, 4, 0],
                  scale: [1, 1.06, 0.96, 1.03, 1],
                }
              : {}
          }
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="relative"
        >
          <PiggyBank size={182} happy={pigHappy} pulsing />
        </motion.div>
      </div>

      <FloatingCoin visible={showCoin} />

      <div className="relative z-10 mb-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={handleFeed}
          disabled={feeding || feedPending || !walletReadyForTransactions}
          className="w-full py-5 rounded-2xl text-white flex items-center justify-center"
          style={{
            background:
              walletReadyForTransactions
                ? 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)'
                : 'rgba(255,255,255,0.06)',
            boxShadow: walletReadyForTransactions
              ? '0 8px 40px rgba(249,115,22,0.45)'
              : 'none',
            fontWeight: 700,
            fontSize: 17,
            color: walletReadyForTransactions ? '#fff' : 'rgba(255,255,255,0.35)',
          }}
        >
          {walletReadyForTransactions
            ? feedPending
              ? 'Sending onchain...'
              : ctaLabel
            : 'Activate wallet first'}
        </motion.button>
      </div>

      {showWalletSheet && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-[28px] p-4"
            style={{
              background: 'rgba(13,18,32,0.98)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-white" style={{ fontWeight: 700, fontSize: 14 }}>
                  Wallet balances
                </div>
                <div className="text-white/35" style={{ fontSize: 12 }}>
                  Live account snapshot
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void refreshBalances()}
                  disabled={balancesLoading}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    opacity: balancesLoading ? 0.6 : 1,
                  }}
                >
                  <motion.div
                    animate={balancesLoading ? { rotate: 360 } : { rotate: 0 }}
                    transition={balancesLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
                  >
                    <RefreshCw size={14} className="text-white/60" />
                  </motion.div>
                </button>
                <button
                  onClick={() => setShowWalletSheet(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <X size={14} className="text-white/60" />
                </button>
              </div>
            </div>

            {balancesError && (
              <div className="mb-3 text-red-300" style={{ fontSize: 12 }}>
                {balancesError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {balances.map((balance) => (
                <div
                  key={balance.address}
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      balance.symbol === 'STRK'
                        ? 'rgba(251,146,60,0.25)'
                        : balance.symbol === 'ETH'
                          ? 'rgba(167,139,250,0.25)'
                          : balance.symbol === 'USDC'
                            ? 'rgba(34,211,238,0.18)'
                            : 'rgba(251,191,36,0.22)'
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        balance.symbol === 'STRK'
                          ? '#FB923C'
                          : balance.symbol === 'ETH'
                            ? '#A78BFA'
                            : balance.symbol === 'USDC'
                              ? '#22D3EE'
                              : '#FBBF24',
                    }}
                  >
                    {balance.symbol}
                  </div>
                  <div className="text-white mt-1" style={{ fontWeight: 800, fontSize: 16 }}>
                    {balance.displayAmount}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            aria-label="Close wallet balances"
            onClick={() => setShowWalletSheet(false)}
            className="fixed inset-0 -z-10"
          />
        </div>
      )}

    </div>
  );
}

function HeaderMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl px-3 py-2 min-w-[86px]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ color, fontWeight: 700, fontSize: 10 }}>{label}</div>
      <div className="text-white mt-1" style={{ fontWeight: 800, fontSize: 14 }}>
        {value}
      </div>
    </div>
  );
}
