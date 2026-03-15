import { resolveApiUrl } from './env';
import type { FeedMode } from './onchain';

export interface YieldRate {
  mode: FeedMode;
  assetSymbol: string;
  protocolLabel: string;
  yieldLabel: 'APR' | 'APY';
  ratePercent: number;
}

export interface AppStakeTotals {
  configured: boolean;
  strkAmount: number;
  btcAmount: number;
  ethAmount: number;
  usdcAmount: number;
  updatedAt: string | null;
}

export interface MarketOverview {
  updatedAt: string;
  rates: Record<FeedMode, YieldRate>;
  totals: AppStakeTotals;
}

export interface SyncPocketPigPayload {
  user: {
    userId: string | null;
    walletAddress: string | null;
    providerKind: 'privy' | 'cartridge' | 'native' | null;
    userName: string;
    userEmail: string | null;
    referralCode: string;
  };
  settings: {
    mode: FeedMode;
    growAmount: number;
    ethAmount: number;
    bitcoinAmount: number;
    usdcAmount: number;
    notifications: boolean;
    autoFeed: boolean;
    pigSkin: string;
  };
  progress: {
    xp: number;
    lifetimeXp: number;
    streak: number;
    longestStreak: number;
    level: number;
    totalSaved: number;
    fedToday: boolean;
  };
  balances: Array<{
    assetSymbol: string;
    amount: string;
    rawAmount: string;
  }>;
  positions: Array<{
    positionKey: string;
    protocol: string;
    mode: FeedMode;
    assetSymbol: string;
    amount: string;
    rewards: string | null;
    unpooling: string | null;
    metadata: Record<string, unknown>;
  }>;
  feedEvents: Array<{
    txHash: string;
    date: string;
    mode: FeedMode;
    amount: number;
    xp: number;
    eventType?: 'feed' | 'dca_create';
    protocol?: string | null;
    cadence?: 'daily' | 'weekly' | null;
    iterations?: number | null;
    orderAddress?: string | null;
    assetSymbol: string | null;
    usdValue: number | null;
    priceUsd: number | null;
    feeBps: number | null;
    feeAmountDisplay: string | null;
    feeAmountUsd: number | null;
    sourceAmountDisplay: string | null;
    targetSymbol: string | null;
    targetAmountDisplay: string | null;
    targetAmountUsd: number | null;
  }>;
}

export interface PersistedFeedEntry {
  date: string;
  amount: number;
  mode: FeedMode;
  xp: number;
  eventType?: 'feed' | 'dca_create';
  protocol?: string | null;
  cadence?: 'daily' | 'weekly' | null;
  iterations?: number | null;
  orderAddress?: string | null;
  assetSymbol?: string;
  usdValue?: number | null;
  priceUsd?: number | null;
  feeBps?: number | null;
  feeAmountDisplay?: string;
  feeAmountUsd?: number | null;
  txHash?: string;
  targetSymbol?: string;
  sourceAmountDisplay?: string;
  targetAmountDisplay?: string;
  targetAmountUsd?: number | null;
}

export interface RemotePocketPigState {
  isOnboarded: boolean;
  mode: FeedMode;
  dailyAmount: number;
  targetUsdAmount: number;
  ethAmount: number;
  bitcoinAmount: number;
  notifications: boolean;
  autoFeed: boolean;
  pigSkin: string;
  referralCode: string;
  feedEntries: PersistedFeedEntry[];
}

export interface LoadPocketPigStateResponse {
  configured: boolean;
  found: boolean;
  state: RemotePocketPigState | null;
}

export interface WeeklyLeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  you: boolean;
}

export interface WeeklyLeaderboardResponse {
  configured: boolean;
  entries: WeeklyLeaderboardEntry[];
}

export interface DcaCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export interface DcaCallsResponse {
  chainId: string;
  calls: DcaCall[];
}

export interface DcaOrderTrade {
  sellAmount: string;
  sellAmountInUsd?: number;
  buyAmount?: string;
  buyAmountInUsd?: number;
  expectedTradeDate: string;
  actualTradeDate?: string;
  status: 'PENDING' | 'SUCCEEDED' | 'CANCELLED';
  txHash?: string;
  errorReason?: string;
}

export interface DcaOrder {
  id: string;
  traderAddress: string;
  orderAddress: string;
  creationTransactionHash: string;
  sellTokenAddress: string;
  sellAmount: string;
  sellAmountPerCycle: string;
  buyTokenAddress: string;
  startDate: string;
  endDate: string;
  closeDate?: string;
  frequency: string;
  iterations: number;
  status: 'INDEXING' | 'ACTIVE' | 'CLOSED';
  amountSold: string;
  amountBought: string;
  averageAmountBought: string;
  executedTradesCount: number;
  cancelledTradesCount: number;
  pendingTradesCount: number;
  trades: DcaOrderTrade[];
}

export interface DcaOrdersResponse {
  content: DcaOrder[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface SyncPocketPigDcaPayload {
  user: {
    userId: string | null;
    walletAddress: string | null;
  };
  orders: Array<{
    orderId: string;
    orderAddress: string;
    traderAddress: string;
    creationTransactionHash: string;
    buyMode: Extract<FeedMode, 'bitcoin' | 'grow' | 'eth'>;
    buyAssetSymbol: 'BTC' | 'STRK' | 'ETH';
    cadence: 'daily' | 'weekly';
    usdcPerCycle: number;
    iterations: number;
    totalBudgetUsdc: number;
    status: 'INDEXING' | 'ACTIVE' | 'CLOSED';
    amountSold: string;
    amountBought: string;
    averageAmountBought: string;
    executedTradesCount: number;
    pendingTradesCount: number;
    cancelledTradesCount: number;
    metadata?: Record<string, unknown>;
  }>;
  events: Array<{
    txHash: string;
    eventDate: string;
    eventType: 'create' | 'cancel';
    mode: Extract<FeedMode, 'bitcoin' | 'grow' | 'eth'>;
    assetSymbol: 'BTC' | 'STRK' | 'ETH';
    cadence: 'daily' | 'weekly';
    usdcPerCycle: number;
    iterations: number;
    usdValue: number;
    xp: number;
    orderAddress?: string | null;
  }>;
}

export const FALLBACK_MARKET_OVERVIEW: MarketOverview = {
  updatedAt: new Date(2026, 2, 8).toISOString(),
  rates: {
    grow: {
      mode: 'grow',
      assetSymbol: 'STRK',
      protocolLabel: 'Starknet native staking',
      yieldLabel: 'APR',
      ratePercent: 8.54,
    },
    bitcoin: {
      mode: 'bitcoin',
      assetSymbol: 'BTC',
      protocolLabel: 'Starknet BTC staking',
      yieldLabel: 'APR',
      ratePercent: 3.01,
    },
    eth: {
      mode: 'eth',
      assetSymbol: 'ETH',
      protocolLabel: 'Vesu supply',
      yieldLabel: 'APY',
      ratePercent: 0,
    },
    safe: {
      mode: 'safe',
      assetSymbol: 'USDC',
      protocolLabel: 'Vesu supply',
      yieldLabel: 'APY',
      ratePercent: 2,
    },
  },
  totals: {
    configured: false,
    strkAmount: 0,
    btcAmount: 0,
    ethAmount: 0,
    usdcAmount: 0,
    updatedAt: null,
  },
};

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => null)) as T | { details?: string } | null;

  if (!response.ok) {
    const details =
      payload && typeof payload === 'object' && 'details' in payload
        ? payload.details
        : 'Request failed.';
    throw new Error(details ?? 'Request failed.');
  }

  return payload as T;
}

export async function fetchMarketOverview() {
  try {
    const liveOverview = await readJson<MarketOverview>(resolveApiUrl('/api/market/overview'));
    return {
      ...liveOverview,
      rates: {
        grow: {
          ...liveOverview.rates.grow,
          ratePercent:
            liveOverview.rates.grow.ratePercent > 0
              ? liveOverview.rates.grow.ratePercent
              : FALLBACK_MARKET_OVERVIEW.rates.grow.ratePercent,
        },
        bitcoin: {
          ...liveOverview.rates.bitcoin,
          ratePercent:
            liveOverview.rates.bitcoin.ratePercent > 0
              ? liveOverview.rates.bitcoin.ratePercent
              : FALLBACK_MARKET_OVERVIEW.rates.bitcoin.ratePercent,
        },
        eth: {
          ...(liveOverview.rates.eth ?? FALLBACK_MARKET_OVERVIEW.rates.eth),
          ratePercent:
            (liveOverview.rates.eth?.ratePercent ?? -1) >= 0
              ? (liveOverview.rates.eth?.ratePercent ?? FALLBACK_MARKET_OVERVIEW.rates.eth.ratePercent)
              : FALLBACK_MARKET_OVERVIEW.rates.eth.ratePercent,
        },
        safe: {
          ...liveOverview.rates.safe,
          ratePercent:
            liveOverview.rates.safe.ratePercent > 0
              ? liveOverview.rates.safe.ratePercent
              : FALLBACK_MARKET_OVERVIEW.rates.safe.ratePercent,
        },
      },
    };
  } catch {
    return FALLBACK_MARKET_OVERVIEW;
  }
}

export async function fetchPocketPigState(params: {
  userId: string | null;
  walletAddress: string | null;
}) {
  const search = new URLSearchParams();
  if (params.userId) {
    search.set('userId', params.userId);
  }
  if (params.walletAddress) {
    search.set('walletAddress', params.walletAddress);
  }

  return await readJson<LoadPocketPigStateResponse>(
    resolveApiUrl(`/api/supabase/state?${search.toString()}`),
  );
}

export async function syncPocketPigState(payload: SyncPocketPigPayload) {
  return await readJson<{ ok: true; configured: boolean }>(resolveApiUrl('/api/supabase/sync'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchWeeklyLeaderboard(params: {
  userId?: string | null;
  walletAddress?: string | null;
}) {
  const search = new URLSearchParams();
  if (params.userId) {
    search.set('userId', params.userId);
  }
  if (params.walletAddress) {
    search.set('walletAddress', params.walletAddress);
  }

  return await readJson<WeeklyLeaderboardResponse>(
    resolveApiUrl(`/api/leaderboard/weekly?${search.toString()}`),
  );
}

export async function fetchDcaOrders(params: {
  traderAddress: string;
  status?: 'ACTIVE' | 'CLOSED' | 'INDEXING';
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  search.set('traderAddress', params.traderAddress);
  if (params.status) {
    search.set('status', params.status);
  }
  if (typeof params.page === 'number') {
    search.set('page', String(params.page));
  }
  if (typeof params.size === 'number') {
    search.set('size', String(params.size));
  }

  return await readJson<DcaOrdersResponse>(resolveApiUrl(`/api/dca/orders?${search.toString()}`));
}

export async function fetchDcaCreateCalls(payload: {
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount: string;
  sellAmountPerCycle: string;
  frequency: string;
  pricingStrategy: {
    tokenToMinAmount: null;
    tokenToMaxAmount: null;
  };
  traderAddress: string;
}) {
  return await readJson<DcaCallsResponse>(resolveApiUrl('/api/dca/orders/calls'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchDcaCancelCalls(orderAddress: string) {
  return await readJson<DcaCallsResponse>(resolveApiUrl('/api/dca/orders/cancel-calls'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderAddress }),
  });
}

export async function syncPocketPigDca(payload: SyncPocketPigDcaPayload) {
  return await readJson<{ ok: true; configured: boolean }>(resolveApiUrl('/api/supabase/dca-sync'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
