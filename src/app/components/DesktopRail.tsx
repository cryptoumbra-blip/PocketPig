import React from 'react';
import { Shield, Bitcoin, Sprout, Gem, Wallet, Layers } from 'lucide-react';
import { PiggyBank } from './PiggyBank';
import { useApp } from '../context/AppContext';

const modeConfig = {
  safe: { label: 'USDC', icon: Shield, color: '#22D3EE' },
  bitcoin: { label: 'Bitcoin', icon: Bitcoin, color: '#FBBF24' },
  eth: { label: 'ETH', icon: Gem, color: '#A78BFA' },
  grow: { label: 'STRK', icon: Sprout, color: '#34D399' },
};

function formatBitcoinAmount(value: number) {
  return value.toFixed(8).replace(/\.?0+$/, '');
}

function formatUsdcAmount(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function formatEthAmount(value: number) {
  return value.toFixed(6).replace(/\.?0+$/, '');
}

export const DesktopRail: React.FC = () => {
  const {
    mode,
    dailyAmount,
    targetUsdAmount,
    ethAmount,
    bitcoinAmount,
    walletLabel,
    pigSkin,
    stakingPositions,
    safePosition,
    ethPosition,
    totalFeedCount,
  } = useApp();

  const currentMode = modeConfig[mode];
  const ModeIcon = currentMode.icon;

  const totalGrowStaked = stakingPositions
    .filter((position) => position.mode === 'grow')
    .reduce((sum, position) => sum + Number(position.stakedDisplay), 0);
  const totalBitcoinStaked = stakingPositions
    .filter((position) => position.mode === 'bitcoin')
    .reduce((sum, position) => sum + Number(position.stakedDisplay), 0);
  const totalSafeSupplied = Number(safePosition?.suppliedDisplay ?? 0);
  const totalEthSupplied = Number(ethPosition?.suppliedDisplay ?? 0);

  return (
    <aside className="hidden xl:block xl:w-[300px] 2xl:w-[330px]">
      <div className="sticky top-6 space-y-5">
        <div
          className="relative overflow-hidden rounded-[28px] p-6"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-40"
            style={{
              background:
                'radial-gradient(circle at top, rgba(249,115,22,0.28) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/40" style={{ fontSize: 12 }}>
                  PocketPig desk
                </div>
                <div className="text-white mt-1" style={{ fontSize: 20, fontWeight: 800 }}>
                  Portfolio view
                </div>
              </div>
              <div
                className="rounded-full px-3 py-1.5 flex items-center gap-2"
                style={{
                  background: `${currentMode.color}12`,
                  border: `1px solid ${currentMode.color}33`,
                }}
              >
                <ModeIcon size={14} style={{ color: currentMode.color }} />
                <span style={{ color: currentMode.color, fontSize: 12, fontWeight: 700 }}>
                  {currentMode.label}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <PiggyBank size={128} skin={pigSkin} pulsing />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniCard
                label="Active control"
                value={
                  mode === 'grow'
                    ? `${dailyAmount} STRK`
                    : mode === 'eth'
                      ? `${ethAmount} ETH`
                    : mode === 'bitcoin'
                      ? `${formatBitcoinAmount(bitcoinAmount)} WBTC`
                      : `${formatUsdcAmount(targetUsdAmount)} USDC`
                }
                accent="#FB923C"
              />
              <MiniCard label="Feed actions" value={`${totalFeedCount}`} accent="#22D3EE" />
              <MiniCard label="STRK staked" value={formatUsdcAmount(totalGrowStaked)} accent="#34D399" />
              <MiniCard label="BTC staked" value={formatBitcoinAmount(totalBitcoinStaked)} accent="#FBBF24" />
              <MiniCard label="ETH supplied" value={formatEthAmount(totalEthSupplied)} accent="#A78BFA" />
              <MiniCard label="USDC supplied" value={formatUsdcAmount(totalSafeSupplied)} accent="#22D3EE" />
            </div>
          </div>
        </div>

        <div
          className="rounded-[24px] p-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={15} className="text-white/60" />
            <span className="text-white" style={{ fontWeight: 700, fontSize: 14 }}>
              Active wallet
            </span>
          </div>
          <div className="text-white/45" style={{ fontSize: 12 }}>
            Connected Starknet account
          </div>
          <div className="text-white mt-2" style={{ fontWeight: 700, fontSize: 16 }}>
            {walletLabel}
          </div>
        </div>

        <div
          className="rounded-[24px] p-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers size={15} className="text-white/60" />
            <span className="text-white" style={{ fontWeight: 700, fontSize: 14 }}>
              Position snapshot
            </span>
          </div>

          <div className="space-y-3">
            {safePosition && Number(safePosition.suppliedDisplay) > 0 && (
              <div
                className="rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="text-white" style={{ fontWeight: 600, fontSize: 13 }}>
                  USDC via {safePosition.protocolLabel}
                </div>
                <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
                  {safePosition.suppliedDisplay} supplied
                </div>
              </div>
            )}
            {ethPosition && Number(ethPosition.suppliedDisplay) > 0 && (
              <div
                className="rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="text-white" style={{ fontWeight: 600, fontSize: 13 }}>
                  ETH via {ethPosition.protocolLabel}
                </div>
                <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
                  {ethPosition.suppliedDisplay} supplied
                </div>
              </div>
            )}
            {stakingPositions.map((position) => (
              <div
                key={position.id}
                className="rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="text-white" style={{ fontWeight: 600, fontSize: 13 }}>
                  {position.tokenSymbol} via {position.validatorLabel}
                </div>
                <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
                  {position.stakedDisplay} staked · {position.rewardsDisplay} rewards
                </div>
              </div>
            ))}

            {stakingPositions.length === 0 && (
              <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.7 }}>
                No tracked staking positions yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

function MiniCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ color: accent, fontWeight: 700, fontSize: 14 }}>{value}</div>
      <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
        {label}
      </div>
    </div>
  );
}
