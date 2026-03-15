import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { appEnv } from '../../lib/env';

function formatBitcoinAmount(value: number) {
  return value.toFixed(8).replace(/\.?0+$/, '');
}

function formatUsdcAmount(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function formatRate(value: number) {
  return `${value.toFixed(2)}%`;
}

export default function Profile() {
  const {
    userName,
    totalFeedCount,
    streak,
    level,
    referralCode,
    todaysFeeds,
    marketOverview,
    syncError,
    safePosition,
    safePositionLoading,
    safePositionError,
    refreshSafePosition,
    withdrawSafePosition,
    ethPosition,
    ethPositionLoading,
    ethPositionError,
    refreshEthPosition,
    withdrawEthPosition,
    safeActionPending,
    stakingPositions,
    positionsLoading,
    positionsError,
    refreshPositions,
    claimPositionRewards,
    unstakePosition,
    positionActionId,
  } = useApp();
  const [copied, setCopied] = useState(false);
  const explorerBaseUrl =
    appEnv.starkzapNetwork === 'mainnet'
      ? 'https://voyager.online/tx/'
      : 'https://sepolia.voyager.online/tx/';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-white/40 mb-0.5" style={{ fontSize: 13 }}>Account</div>
          <h1 className="text-white" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Profile
          </h1>
        </div>
      </div>

      <div
        className="p-5 rounded-3xl mb-5"
        style={{
          background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(251,191,36,0.05) 100%)',
          border: '1px solid rgba(249,115,22,0.2)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', boxShadow: '0 0 20px rgba(249,115,22,0.4)' }}
          >
            🐷
          </div>
          <div>
            <div className="text-white mb-0.5" style={{ fontWeight: 800, fontSize: 18 }}>{userName}</div>
            <div className="text-white/40" style={{ fontSize: 13 }}>
              Level {level} · {streak} day streak · {totalFeedCount} total feeds
            </div>
          </div>
        </div>
      </div>

      <SectionLabel label="USDC position" />
      <SettingCard className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>
              Vesu USDC supply
            </div>
            <div className="text-white/40" style={{ fontSize: 12 }}>
              USDC deposits directly into Vesu Genesis Pool
            </div>
          </div>
          <button
            onClick={() => void refreshSafePosition()}
            disabled={safePositionLoading}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <motion.div
              animate={safePositionLoading ? { rotate: 360 } : { rotate: 0 }}
              transition={safePositionLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
            >
              <RefreshCw size={14} className="text-white/60" />
            </motion.div>
          </button>
        </div>

        {safePositionError && (
          <div className="mb-3 text-red-300" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {safePositionError}
          </div>
        )}

        {safePosition ? (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#22D3EE', fontSize: 12, fontWeight: 700 }}>
                    USDC
                  </span>
                  <span className="text-white/30" style={{ fontSize: 12 }}>
                    {safePosition.protocolLabel} · {safePosition.poolLabel}
                  </span>
                </div>
                <div className="text-white mt-1" style={{ fontWeight: 700, fontSize: 16 }}>
                  {safePosition.suppliedDisplay} {safePosition.assetSymbol}
                </div>
                <div className="text-white/40 mt-1" style={{ fontSize: 12 }}>
                  Withdrawable {safePosition.maxWithdrawDisplay} · Shares {safePosition.sharesDisplay}
                </div>
                {marketOverview?.rates.safe && (
                  <div className="text-white/30 mt-1" style={{ fontSize: 11 }}>
                    Live {marketOverview.rates.safe.yieldLabel} {formatRate(marketOverview.rates.safe.ratePercent)}
                    {' '}· 1y est +{formatUsdcAmount(
                      (Number(safePosition.suppliedDisplay) * marketOverview.rates.safe.ratePercent) / 100,
                    )} USDC
                  </div>
                )}
              </div>

              <button
                onClick={() => void withdrawSafePosition()}
                disabled={!safePosition.canWithdraw || safeActionPending}
                className="px-3 py-2 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: safePosition.canWithdraw ? '#fff' : 'rgba(255,255,255,0.35)',
                  fontSize: 12,
                  fontWeight: 700,
                  minWidth: 120,
                }}
              >
                {safeActionPending ? 'Working...' : 'Withdraw all'}
              </button>
            </div>
          </div>
        ) : !safePositionLoading ? (
          <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.7 }}>
            No active Vesu USDC supply position yet.
          </div>
        ) : null}
      </SettingCard>

      <SectionLabel label="ETH position" />
      <SettingCard className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>
              Vesu ETH supply
            </div>
            <div className="text-white/40" style={{ fontSize: 12 }}>
              ETH deposits directly into Vesu Genesis Pool
            </div>
          </div>
          <button
            onClick={() => void refreshEthPosition()}
            disabled={ethPositionLoading}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <motion.div
              animate={ethPositionLoading ? { rotate: 360 } : { rotate: 0 }}
              transition={ethPositionLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
            >
              <RefreshCw size={14} className="text-white/60" />
            </motion.div>
          </button>
        </div>

        {ethPositionError && (
          <div className="mb-3 text-red-300" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {ethPositionError}
          </div>
        )}

        {ethPosition ? (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#A78BFA', fontSize: 12, fontWeight: 700 }}>
                    ETH
                  </span>
                  <span className="text-white/30" style={{ fontSize: 12 }}>
                    {ethPosition.protocolLabel} · {ethPosition.poolLabel}
                  </span>
                </div>
                <div className="text-white mt-1" style={{ fontWeight: 700, fontSize: 16 }}>
                  {ethPosition.suppliedDisplay} {ethPosition.assetSymbol}
                </div>
                <div className="text-white/40 mt-1" style={{ fontSize: 12 }}>
                  Withdrawable {ethPosition.maxWithdrawDisplay} · Shares {ethPosition.sharesDisplay}
                </div>
                {marketOverview?.rates.eth && (
                  <div className="text-white/30 mt-1" style={{ fontSize: 11 }}>
                    Live {marketOverview.rates.eth.yieldLabel} {formatRate(marketOverview.rates.eth.ratePercent)}
                    {' '}· 1y est +
                    {Number((Number(ethPosition.suppliedDisplay) * marketOverview.rates.eth.ratePercent) / 100).toFixed(6).replace(/\.?0+$/, '')} ETH
                  </div>
                )}
              </div>

              <button
                onClick={() => void withdrawEthPosition()}
                disabled={!ethPosition.canWithdraw || safeActionPending}
                className="px-3 py-2 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: ethPosition.canWithdraw ? '#fff' : 'rgba(255,255,255,0.35)',
                  fontSize: 12,
                  fontWeight: 700,
                  minWidth: 120,
                }}
              >
                {safeActionPending ? 'Working...' : 'Withdraw all'}
              </button>
            </div>
          </div>
        ) : !ethPositionLoading ? (
          <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.7 }}>
            No active Vesu ETH supply position yet.
          </div>
        ) : null}
      </SettingCard>

      <SectionLabel label="Staking positions" />
      <SettingCard className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>
              Native staking
            </div>
            <div className="text-white/40" style={{ fontSize: 12 }}>
              STRK and Bitcoin pools with claim / unstake actions
            </div>
          </div>
          <button
            onClick={() => void refreshPositions()}
            disabled={positionsLoading}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <motion.div
              animate={positionsLoading ? { rotate: 360 } : { rotate: 0 }}
              transition={positionsLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
            >
              <RefreshCw size={14} className="text-white/60" />
            </motion.div>
          </button>
        </div>

        {positionsError && (
          <div className="mb-3 text-red-300" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {positionsError}
          </div>
        )}

        <div className="space-y-3">
          {stakingPositions.map((position) => {
            const accent = position.mode === 'grow' ? '#34D399' : '#FBBF24';
            const liveRate =
              position.mode === 'grow'
                ? marketOverview?.rates.grow
                : marketOverview?.rates.bitcoin;
            const numericStaked = Number(position.stakedDisplay);
            return (
              <div
                key={position.id}
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: accent, fontSize: 12, fontWeight: 700 }}>
                        {position.mode === 'grow' ? 'STRK' : 'Bitcoin'}
                      </span>
                      <span className="text-white/30" style={{ fontSize: 12 }}>
                        {position.validatorLabel}
                      </span>
                    </div>
                    <div className="text-white mt-1" style={{ fontWeight: 700, fontSize: 16 }}>
                      {position.stakedDisplay} {position.tokenSymbol}
                    </div>
                    <div className="text-white/40 mt-1" style={{ fontSize: 12 }}>
                      Rewards {position.rewardsDisplay} {position.rewardsSymbol} · Unpooling {position.unpoolingDisplay} {position.tokenSymbol}
                    </div>
                    {liveRate && (
                      <div className="text-white/30 mt-1" style={{ fontSize: 11 }}>
                        Live {liveRate.yieldLabel} {formatRate(liveRate.ratePercent)}
                        {' '}· 1y est +{
                          position.mode === 'grow'
                            ? formatUsdcAmount((numericStaked * liveRate.ratePercent) / 100)
                            : formatBitcoinAmount((numericStaked * liveRate.ratePercent) / 100)
                        } {position.tokenSymbol}
                      </div>
                    )}
                    {position.unpoolTime && !position.canCompleteExit && (
                      <div className="text-white/30 mt-1" style={{ fontSize: 11 }}>
                        Exit ready at {new Date(position.unpoolTime).toLocaleString('en-US')}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 min-w-[132px]">
                    <button
                      onClick={() => void claimPositionRewards(position.id)}
                      disabled={!position.canClaim || positionActionId === position.id}
                      className="px-3 py-2 rounded-xl"
                      style={{
                        background: position.canClaim ? `${accent}18` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${position.canClaim ? `${accent}40` : 'rgba(255,255,255,0.08)'}`,
                        color: position.canClaim ? accent : 'rgba(255,255,255,0.35)',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {positionActionId === position.id ? 'Working...' : 'Claim'}
                    </button>
                    <button
                      onClick={() => void unstakePosition(position.id)}
                      disabled={!position.canUnstake || positionActionId === position.id}
                      className="px-3 py-2 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: position.canUnstake ? '#fff' : 'rgba(255,255,255,0.35)',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {position.canCompleteExit ? 'Complete exit' : 'Unstake'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!positionsLoading && stakingPositions.length === 0 && (
            <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.7 }}>
              No managed staking positions yet.
            </div>
          )}
        </div>
      </SettingCard>

      <SectionLabel label="Today's feeds" />
      <SettingCard className="mb-5">
        <div className="space-y-3">
          {todaysFeeds.map((entry, index) => {
            const accent =
              entry.mode === 'grow'
                ? '#34D399'
                : entry.mode === 'safe'
                  ? '#22D3EE'
                  : entry.mode === 'eth'
                    ? '#A78BFA'
                    : '#FBBF24';
            const title =
              entry.mode === 'grow'
                ? 'Stake STRK'
                : entry.mode === 'eth'
                  ? `Supply ${entry.targetSymbol ?? 'ETH'}`
                : entry.mode === 'bitcoin'
                  ? `Stake ${entry.targetSymbol ?? 'BTC'}`
                  : `Supply ${entry.targetSymbol ?? 'USDC'}`;

            return (
              <div
                key={`${entry.txHash ?? 'feed'}-${index}`}
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white" style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
                    <div className="text-white/40 mt-1" style={{ fontSize: 12 }}>
                      Source {entry.sourceAmountDisplay ?? `${entry.amount}`}
                    </div>
                    {entry.feeAmountDisplay && (
                      <div className="text-white/30 mt-1" style={{ fontSize: 11 }}>
                        Fee {entry.feeAmountDisplay} {entry.assetSymbol ?? ''}
                      </div>
                    )}
                    {entry.targetAmountDisplay && (
                      <div className="text-white/40 mt-1" style={{ fontSize: 12 }}>
                        Target {entry.targetAmountDisplay} {entry.targetSymbol ?? ''}
                      </div>
                    )}
                  </div>
                    <div className="text-right">
                      <div style={{ color: accent, fontWeight: 700, fontSize: 12 }}>
                      {entry.usdValue
                        ? `$${entry.usdValue.toFixed(2)}`
                        : entry.mode === 'safe'
                          ? 'Vesu'
                          : 'Stake'}
                      </div>
                    <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
                      {entry.xp > 0 ? `+${entry.xp} XP` : 'No XP'}
                    </div>
                  </div>
                </div>
                {entry.txHash && (
                  <a
                    href={`${explorerBaseUrl}${entry.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-emerald-400"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    View tx <ExternalLink size={12} />
                  </a>
                )}
              </div>
            );
          })}

          {todaysFeeds.length === 0 && (
            <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.7 }}>
              No feeds yet today.
            </div>
          )}
        </div>
      </SettingCard>

      {syncError && (
        <>
          <SectionLabel label="Sync" />
          <SettingCard className="mb-5">
            <div className="text-red-300" style={{ fontWeight: 700, fontSize: 13 }}>
              Supabase sync failed
            </div>
            <div className="text-white/45 mt-2" style={{ fontSize: 12, lineHeight: 1.6 }}>
              {syncError}
            </div>
            <div className="text-white/30 mt-2" style={{ fontSize: 11, lineHeight: 1.6 }}>
              Make sure `npm run server:dev` is running and the frontend can reach `/api/supabase/sync`.
            </div>
          </SettingCard>
        </>
      )}

      <SectionLabel label="Referral" />
      <SettingCard>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-white" style={{ fontWeight: 600, fontSize: 14 }}>Refer & earn</div>
            <div className="text-white/40" style={{ fontSize: 12 }}>
              Invite friends and get 100 XP for each friend who feeds their first piggy.
            </div>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-cyan-400"
            style={{ background: 'rgba(34,211,238,0.12)', fontSize: 11, fontWeight: 700 }}
          >
            +100 XP each
          </div>
        </div>
        <div
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-white" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{referralCode}</span>
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl flex items-center gap-2 text-white"
            style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)', fontSize: 12, fontWeight: 700 }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </SettingCard>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="text-white/30 mb-3 px-1" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
      {label}
    </div>
  );
}

function SettingCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`p-5 rounded-3xl ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {children}
    </div>
  );
}
