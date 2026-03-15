import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, RefreshCw, Send, ExternalLink, Wallet as WalletIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { discoverWalletTokenBalances, transferPocketPigAsset, type PocketPigBalance } from '../../lib/onchain';
import { appEnv } from '../../lib/env';

function formatAmount(value: string, symbol: string) {
  if (symbol === 'WBTC') {
    return Number(value).toFixed(8).replace(/\.?0+$/, '');
  }
  if (symbol === 'USDC') {
    return Number(value).toFixed(2).replace(/\.?0+$/, '');
  }
  return Number(value).toFixed(6).replace(/\.?0+$/, '');
}

export default function Wallet() {
  const {
    balances,
    balancesLoading,
    balancesError,
    refreshBalances,
    walletAddress,
    walletLabel,
    walletSourceLabel,
    walletStatus,
    walletDeployed,
    walletError,
    canActivateWallet,
    activateWallet,
    authenticated,
  } = useApp();
  const { account, logout } = useAuth();

  const [walletCopied, setWalletCopied] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
  const [amountText, setAmountText] = useState('');
  const [transferPending, setTransferPending] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferHash, setTransferHash] = useState<string | null>(null);
  const [activatingWallet, setActivatingWallet] = useState(false);
  const [discoveredBalances, setDiscoveredBalances] = useState<PocketPigBalance[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const walletBalances = useMemo(() => {
    const byAddress = new Map<string, PocketPigBalance>();
    for (const balance of balances) {
      byAddress.set(balance.address.toLowerCase(), balance);
    }
    for (const balance of discoveredBalances) {
      byAddress.set(balance.address.toLowerCase(), balance);
    }
    return Array.from(byAddress.values()).sort((left, right) => {
      if (left.symbol === 'STRK') return -1;
      if (right.symbol === 'STRK') return 1;
      return left.symbol.localeCompare(right.symbol);
    });
  }, [balances, discoveredBalances]);

  const explorerBaseUrl =
    appEnv.starkzapNetwork === 'mainnet'
      ? 'https://voyager.online/tx/'
      : 'https://sepolia.voyager.online/tx/';

  const selectedToken = useMemo(
    () => walletBalances.find((balance) => balance.address === selectedTokenAddress) ?? null,
    [walletBalances, selectedTokenAddress],
  );

  useEffect(() => {
    if (!walletAddress) {
      setDiscoveredBalances([]);
      return;
    }

    let cancelled = false;

    const loadDiscoveredBalances = async () => {
      setDiscoveryLoading(true);
      try {
        const nextBalances = await discoverWalletTokenBalances(walletAddress);
        if (!cancelled) {
          setDiscoveredBalances(nextBalances);
          if (!selectedTokenAddress && nextBalances[0]) {
            setSelectedTokenAddress(nextBalances[0].address);
          }
        }
      } catch {
        if (!cancelled) {
          setDiscoveredBalances([]);
        }
      } finally {
        if (!cancelled) {
          setDiscoveryLoading(false);
        }
      }
    };

    void loadDiscoveredBalances();

    return () => {
      cancelled = true;
    };
  }, [balances, walletAddress, selectedTokenAddress]);

  useEffect(() => {
    if (!selectedTokenAddress && walletBalances[0]) {
      setSelectedTokenAddress(walletBalances[0].address);
    }
  }, [selectedTokenAddress, walletBalances]);

  const canTransfer =
    Boolean(account) &&
    walletDeployed === true &&
    Boolean(selectedToken) &&
    Boolean(recipient.trim()) &&
    Number(amountText.replace(',', '.')) > 0 &&
    !transferPending;

  const handleCopyWallet = async () => {
    if (!walletAddress) {
      return;
    }
    await navigator.clipboard.writeText(walletAddress);
    setWalletCopied(true);
    setTimeout(() => setWalletCopied(false), 2000);
  };

  const handleActivateWallet = async () => {
    setActivatingWallet(true);
    try {
      await activateWallet();
    } finally {
      setActivatingWallet(false);
    }
  };

  const handleTransfer = async () => {
    if (!account || !selectedToken) {
      return;
    }

    setTransferPending(true);
    setTransferError(null);
    setTransferHash(null);
    try {
      const txHash = await transferPocketPigAsset({
        account,
        tokenAddress: selectedToken.address,
        tokenDecimals: selectedToken.decimals,
        recipient: recipient.trim(),
        amount: Number(amountText.replace(',', '.')),
      });
      setTransferHash(txHash);
      setAmountText('');
      await refreshBalances();
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Transfer failed.');
    } finally {
      setTransferPending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-white/40 mb-0.5" style={{ fontSize: 13 }}>Wallet</div>
          <h1 className="text-white" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Wallet
          </h1>
        </div>
      </div>

      <div
        className="p-5 rounded-3xl mb-5"
        style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.10) 0%, rgba(249,115,22,0.06) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <WalletIcon size={26} className="text-white/80" />
            </div>
            <div>
              <div className="text-white mb-0.5" style={{ fontWeight: 800, fontSize: 18 }}>
                Connected wallet
              </div>
              <div className="text-white/40" style={{ fontSize: 13 }}>
                {authenticated ? walletSourceLabel : 'No active session'}
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{
              background:
                walletDeployed
                  ? 'rgba(34,197,94,0.1)'
                  : walletStatus === 'needs_backend'
                    ? 'rgba(251,191,36,0.1)'
                    : 'rgba(255,255,255,0.06)',
              border:
                walletDeployed
                  ? '1px solid rgba(34,197,94,0.2)'
                  : walletStatus === 'needs_backend'
                    ? '1px solid rgba(251,191,36,0.2)'
                    : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  walletDeployed
                    ? '#4ADE80'
                    : walletStatus === 'needs_backend'
                      ? '#FBBF24'
                      : 'rgba(255,255,255,0.35)',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color:
                  walletDeployed
                    ? '#4ADE80'
                    : walletStatus === 'needs_backend'
                      ? '#FBBF24'
                      : 'rgba(255,255,255,0.5)',
              }}
            >
              {walletDeployed ? 'Active' : walletStatus === 'activating' ? 'Activating' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/6 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <div className="text-white/35" style={{ fontSize: 12 }}>Starknet address</div>
            <div className="text-white/80 mt-1" style={{ fontSize: 14, fontWeight: 700 }}>
              {walletLabel}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {walletAddress && (
              <button
                onClick={() => void handleCopyWallet()}
                className="px-3 py-2 rounded-xl flex items-center gap-1.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: walletCopied ? '#4ADE80' : 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700 }}
              >
                {walletCopied ? <Check size={14} /> : <Copy size={14} />}
                {walletCopied ? 'Copied' : 'Copy address'}
              </button>
            )}
            {canActivateWallet && walletStatus !== 'active' && (
              <button
                onClick={handleActivateWallet}
                disabled={activatingWallet}
                className="px-3 py-2 rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', fontSize: 12, fontWeight: 700 }}
              >
                {activatingWallet ? 'Activating...' : 'Activate wallet'}
              </button>
            )}
            <button
              onClick={() => void logout()}
              className="px-3 py-2 rounded-xl text-white/75"
              style={{ background: 'rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 700 }}
            >
              Log out
            </button>
          </div>
        </div>

        {walletError && (
          <div className="mt-3 text-red-300" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {walletError}
          </div>
        )}
      </div>

      <SectionLabel label="Live balances" />
      <SettingCard className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white/40" style={{ fontSize: 12 }}>
            Transfer-ready wallet balances
          </div>
          <button
            onClick={() => void refreshBalances()}
            disabled={balancesLoading}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <motion.div
              animate={balancesLoading ? { rotate: 360 } : { rotate: 0 }}
              transition={balancesLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
            >
              <RefreshCw size={14} className="text-white/60" />
            </motion.div>
          </button>
        </div>

        {balancesError && (
          <div className="mb-3 text-red-300" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {balancesError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {walletBalances.map((balance) => (
            <div
              key={balance.address}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-white/40" style={{ fontSize: 12 }}>{balance.symbol}</div>
              <div className="text-white mt-1" style={{ fontWeight: 800, fontSize: 20 }}>
                {formatAmount(balance.displayAmount, balance.symbol)}
              </div>
            </div>
          ))}
        </div>
      </SettingCard>

      <SectionLabel label="Transfer" />
      <SettingCard>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
          <div>
            <div className="text-white/40 mb-2" style={{ fontSize: 12 }}>Asset</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {walletBalances.map((balance) => {
                const active = selectedTokenAddress === balance.address;
                return (
                  <button
                    key={balance.address}
                    onClick={() => setSelectedTokenAddress(balance.address)}
                    className="px-3 py-3 rounded-2xl text-left"
                    style={{
                      background: active ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(249,115,22,0.28)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="text-white" style={{ fontSize: 13, fontWeight: 700 }}>{balance.symbol}</div>
                    <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
                      {formatAmount(balance.displayAmount, balance.symbol)}
                    </div>
                  </button>
                );
              })}
            </div>
            {discoveryLoading && (
              <div className="text-white/35 mt-3" style={{ fontSize: 12 }}>
                Discovering wallet tokens...
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-white/40 mb-2" style={{ fontSize: 12 }}>Recipient</div>
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-4 rounded-2xl bg-transparent text-white outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
            <div>
              <div className="text-white/40 mb-2" style={{ fontSize: 12 }}>Amount</div>
              <input
                value={amountText}
                onChange={(event) => setAmountText(event.target.value)}
                placeholder={selectedToken ? `0 ${selectedToken.symbol}` : '0'}
                className="w-full px-4 py-4 rounded-2xl bg-transparent text-white outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
          </div>
        </div>

        {transferError && (
          <div className="mt-4 text-red-300" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {transferError}
          </div>
        )}

        {transferHash && (
          <a
            href={`${explorerBaseUrl}${transferHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-emerald-400"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            View transfer <ExternalLink size={12} />
          </a>
        )}

        <button
          onClick={() => void handleTransfer()}
          disabled={!canTransfer}
          className="mt-5 w-full px-4 py-4 rounded-3xl text-white"
          style={{
            background: canTransfer
              ? 'linear-gradient(135deg, #F97316, #FBBF24)'
              : 'rgba(255,255,255,0.08)',
            color: canTransfer ? '#fff' : 'rgba(255,255,255,0.4)',
            fontSize: 16,
            fontWeight: 800,
          }}
        >
          {transferPending ? 'Sending...' : (
            <span className="inline-flex items-center gap-2">
              <Send size={16} />
              Send asset
            </span>
          )}
        </button>
      </SettingCard>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="text-white/30 mb-3 ml-2" style={{ fontSize: 12, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase' }}>
      {label}
    </div>
  );
}

function SettingCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl p-5 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  );
}
