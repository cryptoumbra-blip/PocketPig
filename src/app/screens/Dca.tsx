import { useCallback, useEffect, useMemo, useState } from 'react';
import { Repeat, CalendarClock, Bitcoin, Sprout, Gem, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  cancelPocketPigDca,
  createPocketPigDca,
  formatDcaOrderAmount,
  getDcaAssetLabel,
  getDcaIterations,
  listPocketPigDcaOrders,
  resolveDcaOrderLabel,
  type DcaAsset,
  type DcaCadence,
} from '../../lib/dca';
import { syncPocketPigDca, type DcaOrder } from '../../lib/backend';
import { appEnv } from '../../lib/env';

const assetConfig = {
  bitcoin: { label: 'BTC', color: '#FBBF24', icon: Bitcoin },
  grow: { label: 'STRK', color: '#34D399', icon: Sprout },
  eth: { label: 'ETH', color: '#A78BFA', icon: Gem },
} as const;

function resolveDcaSyncMode(assetLabel: string): 'bitcoin' | 'grow' | 'eth' {
  if (assetLabel === 'STRK') {
    return 'grow';
  }
  if (assetLabel === 'ETH') {
    return 'eth';
  }
  return 'bitcoin';
}

function resolveDcaSyncSymbol(assetLabel: string): 'BTC' | 'STRK' | 'ETH' {
  if (assetLabel === 'STRK' || assetLabel === 'ETH') {
    return assetLabel;
  }
  return 'BTC';
}

export default function Dca() {
  const {
    account,
    userId,
    walletAddress,
    walletReadyForTransactions,
    canActivateWallet,
    activateWallet,
  } = useAuth();
  const { recordDcaOrderCreated } = useApp();
  const [asset, setAsset] = useState<DcaAsset>('grow');
  const [cadence, setCadence] = useState<DcaCadence>('weekly');
  const [amount, setAmount] = useState('25');
  const [orders, setOrders] = useState<DcaOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastTransactionHash, setLastTransactionHash] = useState<string | null>(null);
  const [activatingWallet, setActivatingWallet] = useState(false);

  const config = assetConfig[asset];
  const AssetIcon = config.icon;
  const parsedAmount = Number(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const iterations = getDcaIterations(cadence);
  const totalBudget = validAmount * iterations;
  const explorerBaseUrl =
    appEnv.starkzapNetwork === 'mainnet'
      ? 'https://voyager.online/tx/'
      : 'https://sepolia.voyager.online/tx/';

  const summary = useMemo(() => {
    if (!validAmount) {
      return 'Set a positive USDC amount per cycle to create a recurring buy.';
    }

    return cadence === 'daily'
      ? `${iterations} daily buys of ${validAmount.toFixed(2)} USDC each. Total reserved budget ${totalBudget.toFixed(2)} USDC.`
      : `${iterations} weekly buys of ${validAmount.toFixed(2)} USDC each. Total reserved budget ${totalBudget.toFixed(2)} USDC.`;
  }, [cadence, iterations, totalBudget, validAmount]);

  const canCreate = Boolean(
    account &&
      walletAddress &&
      walletReadyForTransactions &&
      validAmount > 0 &&
      !creating,
  );
  const disabledReason = !walletAddress
    ? 'Connect a wallet first.'
    : !walletReadyForTransactions || !account
      ? 'The wallet must be active onchain before a DCA order can be created.'
      : validAmount <= 0
        ? 'Enter a positive USDC amount.'
        : null;

  const syncOrdersToSupabase = useCallback(
    async (nextOrders: DcaOrder[], events: Array<{
      txHash: string;
      eventDate: string;
      eventType: 'create' | 'cancel';
      mode: 'bitcoin' | 'grow' | 'eth';
      assetSymbol: 'BTC' | 'STRK' | 'ETH';
      cadence: 'daily' | 'weekly';
      usdcPerCycle: number;
      iterations: number;
      usdValue: number;
      xp: number;
      orderAddress?: string | null;
    }> = []) => {
      if (!walletAddress) {
        return;
      }

      try {
        await syncPocketPigDca({
          user: {
            userId,
            walletAddress,
          },
          orders: nextOrders.map((order) => ({
            orderId: order.id,
            orderAddress: order.orderAddress,
            traderAddress: order.traderAddress,
            creationTransactionHash: order.creationTransactionHash,
            buyMode: resolveDcaSyncMode(resolveDcaOrderLabel(order)),
            buyAssetSymbol: resolveDcaSyncSymbol(resolveDcaOrderLabel(order)),
            cadence: order.frequency === 'P1D' ? 'daily' : 'weekly',
            usdcPerCycle: Number(formatDcaOrderAmount(order.sellAmountPerCycle, 6, 6)),
            iterations: order.iterations,
            totalBudgetUsdc: Number(formatDcaOrderAmount(order.sellAmount, 6, 6)),
            status: order.status,
            amountSold: order.amountSold,
            amountBought: order.amountBought,
            averageAmountBought: order.averageAmountBought,
            executedTradesCount: order.executedTradesCount,
            pendingTradesCount: order.pendingTradesCount,
            cancelledTradesCount: order.cancelledTradesCount,
            metadata: {
              sellTokenAddress: order.sellTokenAddress,
              buyTokenAddress: order.buyTokenAddress,
              startDate: order.startDate,
              endDate: order.endDate,
              closeDate: order.closeDate ?? null,
            },
          })),
          events,
        });
      } catch (error) {
        console.warn('DCA Supabase sync skipped:', error);
      }
    },
    [userId, walletAddress],
  );

  const loadOrders = useCallback(async () => {
    if (!walletAddress) {
      setOrders([]);
      return;
    }

    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const nextOrders = await listPocketPigDcaOrders(walletAddress);
      setOrders(nextOrders);
      await syncOrdersToSupabase(nextOrders);
    } catch (error) {
      setOrdersError(
        error instanceof Error ? error.message : 'An unknown error occurred while loading DCA orders.',
      );
    } finally {
      setLoadingOrders(false);
    }
  }, [syncOrdersToSupabase, walletAddress]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleCreate = async () => {
    if (!account || !walletAddress) {
      setActionError('An active Starknet account is required to create a DCA order.');
      return;
    }

    if (!walletReadyForTransactions) {
      setActionError('An active onchain wallet is required for DCA. Activate the wallet first.');
      return;
    }

    if (validAmount <= 0) {
      setActionError('Enter a positive USDC amount.');
      return;
    }
    setCreating(true);
    setActionError(null);
    setLastTransactionHash(null);
    try {
      const result = await createPocketPigDca({
        account,
        traderAddress: walletAddress,
        asset,
        cadence,
        usdcPerCycle: validAmount,
      });
      setLastTransactionHash(result.transactionHash);
      const nextOrders = await listPocketPigDcaOrders(walletAddress);
      setOrders(nextOrders);
      const createdOrder =
        nextOrders.find(
          (order) =>
            order.creationTransactionHash.toLowerCase() === result.transactionHash.toLowerCase(),
        ) ?? null;
      recordDcaOrderCreated({
        txHash: result.transactionHash,
        mode: asset,
        assetSymbol: resolveDcaSyncSymbol(result.buyAssetLabel),
        cadence,
        usdcPerCycle: validAmount,
        iterations: result.iterations,
        orderAddress: createdOrder?.orderAddress ?? null,
      });
      await syncOrdersToSupabase(nextOrders, [
        {
          txHash: result.transactionHash,
          eventDate: new Date().toISOString().slice(0, 10),
          eventType: 'create',
          mode: asset,
          assetSymbol: resolveDcaSyncSymbol(result.buyAssetLabel),
          cadence,
          usdcPerCycle: validAmount,
          iterations: result.iterations,
          usdValue: Number((validAmount * result.iterations).toFixed(2)),
          xp: 0,
          orderAddress: createdOrder?.orderAddress ?? null,
        },
      ]);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'An unknown error occurred while creating the DCA order.',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleActivateWallet = async () => {
    setActivatingWallet(true);
    setActionError(null);
    try {
      await activateWallet();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'An unknown error occurred during wallet activation.',
      );
    } finally {
      setActivatingWallet(false);
    }
  };

  const handleCancel = async (order: DcaOrder) => {
    if (!account) {
      setActionError('An active account is required to cancel a DCA order.');
      return;
    }

    setCancelingId(order.id);
    setActionError(null);
    setLastTransactionHash(null);
    try {
      const transactionHash = await cancelPocketPigDca({
        account,
        orderAddress: order.orderAddress,
      });
      setLastTransactionHash(transactionHash);
      const nextOrders = await listPocketPigDcaOrders(walletAddress ?? order.traderAddress);
      setOrders(nextOrders);
      await syncOrdersToSupabase(nextOrders, [
        {
          txHash: transactionHash,
          eventDate: new Date().toISOString().slice(0, 10),
          eventType: 'cancel',
          mode: resolveDcaSyncMode(resolveDcaOrderLabel(order)),
          assetSymbol: resolveDcaSyncSymbol(resolveDcaOrderLabel(order)),
          cadence: order.frequency === 'P1D' ? 'daily' : 'weekly',
          usdcPerCycle: Number(formatDcaOrderAmount(order.sellAmountPerCycle, 6, 6)),
          iterations: order.iterations,
          usdValue: Number(formatDcaOrderAmount(order.sellAmount, 6, 6)),
          xp: 0,
          orderAddress: order.orderAddress,
        },
      ]);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'An unknown error occurred while cancelling the DCA order.',
      );
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-white/40 mb-1" style={{ fontSize: 13 }}>
            Recurring buys
          </div>
          <h1 className="text-white" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
            DCA
          </h1>
        </div>
        <div
          className="rounded-full px-3 py-1.5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-white/70" style={{ fontSize: 11, fontWeight: 700 }}>
            Live AVNU order
          </span>
        </div>
      </div>

      <div
        className="mb-5 rounded-3xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: `${config.color}18`, border: `1px solid ${config.color}33` }}
          >
            <Repeat size={18} style={{ color: config.color }} />
          </div>
          <div>
            <div className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>
              Independent DCA mode
            </div>
            <div className="text-white/40" style={{ fontSize: 12 }}>
              Recurring buy only. Auto-stake and auto-supply come in phase two.
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-white/55 mb-3" style={{ fontSize: 12, fontWeight: 700 }}>
              Buy asset
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(assetConfig) as [DcaAsset, (typeof assetConfig)['bitcoin']][]).map(([id, entry]) => {
                const EntryIcon = entry.icon;
                const active = id === asset;
                return (
                  <button
                    key={id}
                    onClick={() => setAsset(id)}
                    className="rounded-2xl px-3 py-3 text-left"
                    style={{
                      background: active ? `${entry.color}12` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? `${entry.color}55` : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <EntryIcon size={15} style={{ color: active ? entry.color : 'rgba(255,255,255,0.45)' }} />
                      <span style={{ color: active ? entry.color : 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 12 }}>
                        {entry.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-white/55 mb-3" style={{ fontSize: 12, fontWeight: 700 }}>
              Schedule
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['daily', 'weekly'] as DcaCadence[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setCadence(item)}
                  className="rounded-2xl px-3 py-3 text-left"
                  style={{
                    background: cadence === item ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${cadence === item ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CalendarClock size={15} style={{ color: cadence === item ? '#FB923C' : 'rgba(255,255,255,0.45)' }} />
                    <span style={{ color: cadence === item ? '#FB923C' : 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 12 }}>
                      {item === 'daily' ? 'Every day' : 'Every week'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-white/55 mb-2" style={{ fontSize: 12, fontWeight: 700 }}>
              USDC per cycle
            </div>
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-white/45" style={{ fontSize: 18, fontWeight: 800 }}>$</span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-full bg-transparent text-white outline-none"
                  style={{ fontSize: 18, fontWeight: 800 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl p-4"
          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AssetIcon size={15} style={{ color: config.color }} />
            <div className="text-white" style={{ fontWeight: 700, fontSize: 13 }}>
              Plan summary
            </div>
          </div>
          <div className="text-white/55" style={{ fontSize: 13, lineHeight: 1.7 }}>
            {summary}
          </div>
        </div>

        {actionError && (
          <div className="mt-4 text-red-300" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {actionError}
          </div>
        )}

        {lastTransactionHash && (
          <a
            href={`${explorerBaseUrl}${lastTransactionHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-emerald-300"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            View DCA transaction
            <ExternalLink size={14} />
          </a>
        )}

        {disabledReason && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-white/45" style={{ fontSize: 12 }}>
              {disabledReason}
            </div>
            {canActivateWallet && !walletReadyForTransactions && (
              <button
                onClick={() => void handleActivateWallet()}
                disabled={activatingWallet}
                className="rounded-xl px-3 py-2 text-white"
                style={{
                  background: 'rgba(249,115,22,0.12)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {activatingWallet ? 'Activating...' : 'Activate wallet'}
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => void handleCreate()}
          disabled={!canCreate}
          className="mt-5 w-full rounded-2xl px-4 py-4 text-white"
          style={{
            background: canCreate ? 'linear-gradient(135deg, #F97316, #FBBF24)' : 'rgba(255,255,255,0.06)',
            color: canCreate ? '#fff' : 'rgba(255,255,255,0.35)',
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {creating ? 'Creating DCA order...' : `Create ${getDcaAssetLabel(asset)} DCA`}
        </button>
      </div>

      <div
        className="rounded-3xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>
              Active DCA orders
            </div>
            <div className="text-white/40" style={{ fontSize: 12 }}>
              Live AVNU orders for this Starknet wallet
            </div>
          </div>
          <button
            onClick={() => void loadOrders()}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <motion.div
              animate={loadingOrders ? { rotate: 360 } : { rotate: 0 }}
              transition={loadingOrders ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
            >
              <RefreshCw size={14} className="text-white/60" />
            </motion.div>
          </button>
        </div>

        {ordersError && (
          <div className="mb-3 text-red-300" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {ordersError}
          </div>
        )}

        <div className="space-y-3">
          {orders.map((order) => {
            const buyLabel = resolveDcaOrderLabel(order);
            const perCycle = formatDcaOrderAmount(order.sellAmountPerCycle, 6, 2);
            return (
              <div
                key={order.id}
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white" style={{ fontWeight: 700, fontSize: 14 }}>
                        Buy {buyLabel}
                      </span>
                      <span className="text-white/30" style={{ fontSize: 12 }}>
                        {order.frequency === 'P1D' ? 'Daily' : 'Weekly'}
                      </span>
                    </div>
                    <div className="text-white/45 mt-1" style={{ fontSize: 12 }}>
                      {perCycle} USDC per cycle · {order.executedTradesCount}/{order.iterations} fills done
                    </div>
                    <div className="text-white/30 mt-1" style={{ fontSize: 11 }}>
                      Order {order.orderAddress.slice(0, 8)}...{order.orderAddress.slice(-4)}
                    </div>
                  </div>

                  <button
                    onClick={() => void handleCancel(order)}
                    disabled={cancelingId === order.id}
                    className="px-3 py-2 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: cancelingId === order.id ? 'rgba(255,255,255,0.45)' : '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      minWidth: 100,
                    }}
                  >
                    {cancelingId === order.id ? 'Canceling...' : 'Cancel'}
                  </button>
                </div>
              </div>
            );
          })}

          {!loadingOrders && !orders.length && (
            <div className="text-white/35" style={{ fontSize: 12, lineHeight: 1.7 }}>
              No active AVNU DCA orders yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
