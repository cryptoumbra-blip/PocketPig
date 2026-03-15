import React, {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  claimPocketPigStakeRewards,
  executePocketPigFeed,
  getPocketPigFeedPreview,
  getPocketPigBalances,
  getPocketPigEthPosition,
  getPocketPigSafePosition,
  getPocketPigStakingPositions,
  type PocketPigBalance,
  type FeedPreview,
  type SupplyPosition,
  type StakingPosition,
  unstakePocketPigPosition,
  withdrawPocketPigSafePosition,
} from '../../lib/onchain';
import {
  fetchPocketPigState,
  fetchMarketOverview,
  syncPocketPigState,
  type MarketOverview,
  type RemotePocketPigState,
} from '../../lib/backend';
import {
  buildBadges,
  buildMissionCards,
  computeDailyStreak,
  computeLongestStreak,
  getBadgeBonusForNextFeed,
  getCommitmentBonus,
  getDailyBaseXp,
  getDiversityBonus,
  getLevelTitle,
  getStreakBonus,
  getVolumeXp,
  resolveInfiniteLevel,
} from '../../lib/progression';
import { compactAddress, useAuth } from './AuthContext';

export type SavingMode = 'safe' | 'bitcoin' | 'grow' | 'eth';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpAwarded: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Mythic';
  goalLabel: string;
  earned: boolean;
  earnedDate?: string;
  progress: number;
  target: number;
  progressLabel: string;
}

export interface MissionCard {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  complete: boolean;
}

interface FeedEntry {
  date: string;
  amount: number;
  mode: SavingMode;
  xp: number;
  eventType?: 'feed' | 'dca_create';
  txHash?: string;
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
  targetSymbol?: string;
  sourceAmountDisplay?: string;
  targetAmountDisplay?: string;
  targetAmountUsd?: number | null;
}

export interface TodayFeedItem {
  amount: number;
  mode: SavingMode;
  xp: number;
  eventType: 'feed' | 'dca_create';
  txHash: string | null;
  protocol: string | null;
  cadence: 'daily' | 'weekly' | null;
  iterations: number | null;
  orderAddress: string | null;
  assetSymbol: string | null;
  usdValue: number | null;
  feeBps: number | null;
  feeAmountDisplay: string | null;
  feeAmountUsd: number | null;
  targetSymbol: string | null;
  sourceAmountDisplay: string | null;
  targetAmountDisplay: string | null;
  targetAmountUsd: number | null;
}

interface PersistedState {
  isOnboarded: boolean;
  mode: SavingMode;
  dailyAmount: number;
  targetUsdAmount: number;
  ethAmount: number;
  bitcoinAmount: number;
  notifications: boolean;
  autoFeed: boolean;
  pigSkin: string;
  referralCode: string;
  feedEntries: FeedEntry[];
}

interface AppState {
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  mode: SavingMode;
  setMode: (mode: SavingMode) => void;
  dailyAmount: number;
  setDailyAmount: (amount: number) => void;
  targetUsdAmount: number;
  setTargetUsdAmount: (amount: number) => void;
  ethAmount: number;
  setEthAmount: (amount: number) => void;
  bitcoinAmount: number;
  setBitcoinAmount: (amount: number) => void;
  streak: number;
  xp: number;
  currentLevelXp: number;
  currentLevelCap: number;
  level: number;
  xpToNextLevel: number;
  levelTitle: string;
  levelProgressPercent: number;
  lastFeedXp: number;
  lastAwardedXp: number;
  nextFeedXpPreview: number;
  fedToday: boolean;
  totalSaved: number;
  totalFeedCount: number;
  badges: Badge[];
  missions: MissionCard[];
  feed: () => Promise<boolean>;
  feedPending: boolean;
  feedError: string | null;
  lastTransactionHash: string | null;
  lastTransactionLabel: string | null;
  balances: PocketPigBalance[];
  balancesLoading: boolean;
  balancesError: string | null;
  refreshBalances: () => Promise<void>;
  feedPreview: FeedPreview | null;
  feedPreviewLoading: boolean;
  feedPreviewError: string | null;
  marketOverview: MarketOverview | null;
  marketLoading: boolean;
  marketError: string | null;
  refreshMarketOverview: () => Promise<void>;
  syncError: string | null;
  safePosition: SupplyPosition | null;
  safePositionLoading: boolean;
  safePositionError: string | null;
  refreshSafePosition: () => Promise<void>;
  withdrawSafePosition: () => Promise<void>;
  ethPosition: SupplyPosition | null;
  ethPositionLoading: boolean;
  ethPositionError: string | null;
  refreshEthPosition: () => Promise<void>;
  withdrawEthPosition: () => Promise<void>;
  safeActionPending: boolean;
  stakingPositions: StakingPosition[];
  positionsLoading: boolean;
  positionsError: string | null;
  refreshPositions: () => Promise<void>;
  claimPositionRewards: (positionId: string) => Promise<void>;
  unstakePosition: (positionId: string) => Promise<void>;
  positionActionId: string | null;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  autoFeed: boolean;
  setAutoFeed: (value: boolean) => void;
  weeklyProgress: number;
  weeklyTarget: number;
  userName: string;
  userEmail: string | null;
  pigSkin: string;
  setPigSkin: (skin: string) => void;
  referralCode: string;
  weekHistory: boolean[];
  monthHistory: { day: number; saved: boolean }[];
  savingsSeries: { day: string; amount: number }[];
  todaysFeeds: TodayFeedItem[];
  authReady: boolean;
  authConfigured: boolean;
  privyConfigured: boolean;
  authenticated: boolean;
  providerKind: 'privy' | 'cartridge' | 'native' | null;
  walletAddress: string | null;
  walletSourceLabel: string;
  walletStatus:
    | 'unconfigured'
    | 'idle'
    | 'authenticating'
    | 'authenticated'
    | 'activating'
    | 'active'
    | 'needs_backend'
    | 'error';
  walletDeployed: boolean | null;
  walletError: string | null;
  canActivateWallet: boolean;
  walletReadyForTransactions: boolean;
  availableNativeWallets: { id: string; name: string; icon: string }[];
  nativeWalletsLoading: boolean;
  nativeWalletPendingId: string | null;
  loginWith: (method: 'google') => Promise<void>;
  loginWithCartridge: () => Promise<void>;
  connectNativeWallet: (walletId: string) => Promise<void>;
  refreshNativeWallets: () => Promise<void>;
  activateWallet: () => Promise<boolean>;
  logout: () => Promise<void>;
  walletLabel: string;
  recordDcaOrderCreated: (params: {
    txHash: string;
    mode: Exclude<SavingMode, 'safe'>;
    assetSymbol: 'STRK' | 'BTC' | 'ETH';
    cadence: 'daily' | 'weekly';
    usdcPerCycle: number;
    iterations: number;
    orderAddress?: string | null;
  }) => void;
}


const AppContext = createContext<AppState | null>(null);

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, offset: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function formatShortDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildReferralCode(seed: string) {
  const base = seed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'PIGGY';
  return `PP-${base.padEnd(6, 'X')}`;
}

function buildDefaultState(seed = 'guest'): PersistedState {
  return {
    isOnboarded: false,
    mode: 'safe',
    dailyAmount: 1,
    targetUsdAmount: 25,
    ethAmount: 0.01,
    bitcoinAmount: 0.0001,
    notifications: true,
    autoFeed: false,
    pigSkin: 'classic',
    referralCode: buildReferralCode(seed),
    feedEntries: [],
  };
}

function normalizePersistedState(
  incoming: Partial<PersistedState> | RemotePocketPigState,
  seed: string,
): PersistedState {
  return {
    ...buildDefaultState(seed),
    ...incoming,
    feedEntries: Array.isArray(incoming.feedEntries) ? incoming.feedEntries : [],
    referralCode:
      typeof incoming.referralCode === 'string' && incoming.referralCode
        ? incoming.referralCode
        : buildReferralCode(seed),
  };
}

function buildRewardedEntry(params: {
  existingEntries: FeedEntry[];
  baseEntry: FeedEntry;
  todayKey: string;
}) {
  const { existingEntries, baseEntry, todayKey } = params;
  const lifetimeXp = existingEntries.reduce((sum, entry) => sum + entry.xp, 0);
  const levelProgress = resolveInfiniteLevel(lifetimeXp);
  const fedToday = existingEntries.some((entry) => entry.date === todayKey);
  const badgeBonus = getBadgeBonusForNextFeed(existingEntries, baseEntry);

  let earnedXp = badgeBonus;
  if (!fedToday) {
    const nextStreak = computeDailyStreak([...existingEntries, baseEntry], todayKey);
    earnedXp =
      getDailyBaseXp(levelProgress.level) +
      getVolumeXp(Number(baseEntry.usdValue ?? 0)) +
      getCommitmentBonus(baseEntry) +
      getDiversityBonus(existingEntries, baseEntry) +
      getStreakBonus(nextStreak) +
      badgeBonus;
  }

  return {
    ...baseEntry,
    xp: earnedXp,
  };
}

function getProtocolLabelForMode(mode: SavingMode) {
  if (mode === 'safe' || mode === 'eth') {
    return 'Vesu';
  }
  return 'Native staking';
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    authReady,
    authConfigured,
    privyConfigured,
    authenticated,
    providerKind,
    account,
    userId,
    userName,
    userEmail,
    walletAddress,
    walletSourceLabel,
    walletStatus,
    walletDeployed,
    walletError,
    canActivateWallet,
    walletReadyForTransactions,
    availableNativeWallets,
    nativeWalletsLoading,
    nativeWalletPendingId,
    loginWith,
    loginWithCartridge,
    connectNativeWallet,
    refreshNativeWallets,
    activateWallet,
    logout,
  } = useAuth();

  const stateSeed = userId ?? 'guest';
  const [state, setState] = useState<PersistedState>(() =>
    buildDefaultState(stateSeed),
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [feedPending, setFeedPending] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [lastTransactionHash, setLastTransactionHash] = useState<string | null>(null);
  const [lastTransactionLabel, setLastTransactionLabel] = useState<string | null>(null);
  const [lastAwardedXp, setLastAwardedXp] = useState(0);
  const [balances, setBalances] = useState<PocketPigBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [feedPreview, setFeedPreview] = useState<FeedPreview | null>(null);
  const [feedPreviewLoading, setFeedPreviewLoading] = useState(false);
  const [feedPreviewError, setFeedPreviewError] = useState<string | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [safePosition, setSafePosition] = useState<SupplyPosition | null>(null);
  const [safePositionLoading, setSafePositionLoading] = useState(false);
  const [safePositionError, setSafePositionError] = useState<string | null>(null);
  const [ethPosition, setEthPosition] = useState<SupplyPosition | null>(null);
  const [ethPositionLoading, setEthPositionLoading] = useState(false);
  const [ethPositionError, setEthPositionError] = useState<string | null>(null);
  const [safeActionPending, setSafeActionPending] = useState(false);
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [positionActionId, setPositionActionId] = useState<string | null>(null);
  const [stateLoading, setStateLoading] = useState(false);

  useEffect(() => {
    if (authConfigured && !authReady) {
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      setStateLoading(true);
      try {
        if (userId || walletAddress) {
          const remote = await fetchPocketPigState({ userId, walletAddress });
          if (cancelled) {
            return;
          }

          if (remote.configured && remote.found && remote.state) {
            const nextState = normalizePersistedState(remote.state, stateSeed);
            setState(nextState);
            setIsHydrated(true);
            return;
          }
        }

        if (!cancelled) {
          setState(buildDefaultState(stateSeed));
          setIsHydrated(true);
        }
      } catch {
        if (!cancelled) {
          setState(buildDefaultState(stateSeed));
          setIsHydrated(true);
        }
      } finally {
        if (!cancelled) {
          setStateLoading(false);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [authConfigured, authReady, stateSeed, userId, walletAddress]);

  useEffect(() => {
    if (!authConfigured || !authReady || authenticated) {
      return;
    }

    setState((current) => ({
      ...current,
      isOnboarded: false,
    }));
  }, [authConfigured, authReady, authenticated]);

  const todayKey = toDateKey(new Date());
  const totalSaved = useMemo(
    () =>
      state.feedEntries.reduce(
        (sum, entry) => sum + Number(entry.usdValue ?? entry.targetAmountUsd ?? 0),
        0,
      ),
    [state.feedEntries],
  );
  const totalFeedCount = state.feedEntries.length;
  const xp = useMemo(
    () => state.feedEntries.reduce((sum, entry) => sum + entry.xp, 0),
    [state.feedEntries],
  );
  const {
    level,
    currentLevelXp,
    currentLevelCap,
    xpToNextLevel,
    progressPercent: levelProgressPercent,
  } = useMemo(() => resolveInfiniteLevel(xp), [xp]);
  const levelTitle = useMemo(() => getLevelTitle(level), [level]);
  const fedToday = state.feedEntries.some((entry) => entry.date === todayKey);
  const streak = useMemo(
    () => computeDailyStreak(state.feedEntries, todayKey),
    [state.feedEntries, todayKey],
  );
  const longestStreak = useMemo(
    () => computeLongestStreak(state.feedEntries),
    [state.feedEntries],
  );
  const weeklyTarget = 7;
  const weeklyProgress = useMemo(() => {
    return new Set(
      Array.from({ length: 7 }, (_, index) =>
        toDateKey(addDays(new Date(`${todayKey}T00:00:00`), -index)),
      ).filter((dateKey) =>
        state.feedEntries.some((entry) => entry.date === dateKey),
      ),
    ).size;
  }, [state.feedEntries, todayKey]);
  const weekHistory = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const dateKey = toDateKey(addDays(new Date(`${todayKey}T00:00:00`), index - 6));
        return state.feedEntries.some((entry) => entry.date === dateKey);
      }),
    [state.feedEntries, todayKey],
  );
  const monthHistory = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const date = addDays(new Date(`${todayKey}T00:00:00`), index - 29);
        const dateKey = toDateKey(date);
        return {
          day: date.getDate(),
          saved: state.feedEntries.some((entry) => entry.date === dateKey),
        };
      }),
    [state.feedEntries, todayKey],
  );
  const savingsSeries = useMemo(() => {
    const totalsByDate = new Map<string, number>();
    for (const entry of state.feedEntries) {
      totalsByDate.set(entry.date, (totalsByDate.get(entry.date) ?? 0) + 1);
    }

    const series = Array.from(totalsByDate.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .reduce<{ day: string; amount: number }[]>((accumulator, [date, amount]) => {
        const previousAmount = accumulator[accumulator.length - 1]?.amount ?? 0;
        accumulator.push({
          day: formatShortDate(date),
          amount: previousAmount + amount,
        });
        return accumulator;
      }, []);

    if (!series.length) {
      return [{ day: formatShortDate(todayKey), amount: 0 }];
    }

    return series.slice(-5);
  }, [state.feedEntries, todayKey]);
  const lastFeedXp = useMemo(
    () =>
      state.feedEntries
        .filter((entry) => entry.date === todayKey)
        .reduce((sum, entry) => sum + entry.xp, 0),
    [state.feedEntries, todayKey],
  );
  const badges = useMemo(
    () => buildBadges(state.feedEntries),
    [state.feedEntries],
  );
  const missions = useMemo(
    () => buildMissionCards(state.feedEntries, todayKey, streak),
    [state.feedEntries, streak, todayKey],
  );
  const nextFeedXpPreview = useMemo(() => {
    const plannedSourceAmount =
      state.mode === 'grow'
        ? state.dailyAmount
        : state.mode === 'eth'
          ? state.ethAmount
        : state.mode === 'bitcoin'
          ? state.bitcoinAmount
          : feedPreview?.sourceAmount ?? state.targetUsdAmount;
    const plannedUsdValue =
      state.mode === 'safe'
        ? state.targetUsdAmount
        : Number(feedPreview?.usdValue ?? 0);
    const previewEntry: FeedEntry = {
      date: todayKey,
      amount: plannedSourceAmount,
      mode: state.mode,
      xp: 0,
      assetSymbol:
        state.mode === 'grow'
          ? 'STRK'
          : state.mode === 'eth'
            ? 'ETH'
          : state.mode === 'bitcoin'
            ? feedPreview?.targetSymbol ?? 'BTC'
            : 'USDC',
      usdValue: plannedUsdValue > 0 ? plannedUsdValue : null,
      targetSymbol: feedPreview?.targetSymbol,
      sourceAmountDisplay: feedPreview?.sourceAmountDisplay,
      targetAmountDisplay: feedPreview?.targetAmountDisplay,
      targetAmountUsd: plannedUsdValue > 0 ? plannedUsdValue : null,
    };
    const badgeBonus = getBadgeBonusForNextFeed(state.feedEntries, previewEntry);
    const diversityBonus = getDiversityBonus(state.feedEntries, previewEntry);
    const commitmentBonus = getCommitmentBonus(previewEntry);

    if (fedToday) {
      return badgeBonus;
    }

    const nextStreak = computeDailyStreak([...state.feedEntries, previewEntry], todayKey);
    return (
      getDailyBaseXp(level) +
      getVolumeXp(plannedUsdValue) +
      commitmentBonus +
      diversityBonus +
      getStreakBonus(nextStreak) +
      badgeBonus
    );
  }, [
    fedToday,
    feedPreview?.sourceAmount,
    feedPreview?.sourceAmountDisplay,
    feedPreview?.targetAmountDisplay,
    feedPreview?.targetSymbol,
    feedPreview?.usdValue,
    level,
    state.bitcoinAmount,
    state.dailyAmount,
    state.feedEntries,
    state.ethAmount,
    state.mode,
    state.targetUsdAmount,
    todayKey,
  ]);
  const todaysFeeds = useMemo(
    () =>
      state.feedEntries
        .filter((entry) => entry.date === todayKey)
        .map((entry) => ({
          amount: entry.amount,
          mode: entry.mode,
          xp: entry.xp,
          eventType: entry.eventType ?? 'feed',
          txHash: entry.txHash ?? null,
          protocol: entry.protocol ?? null,
          cadence: entry.cadence ?? null,
          iterations: entry.iterations ?? null,
          orderAddress: entry.orderAddress ?? null,
          assetSymbol: entry.assetSymbol ?? null,
          usdValue: entry.usdValue ?? null,
          feeBps: entry.feeBps ?? null,
          feeAmountDisplay: entry.feeAmountDisplay ?? null,
          feeAmountUsd: entry.feeAmountUsd ?? null,
          targetSymbol: entry.targetSymbol ?? null,
          sourceAmountDisplay: entry.sourceAmountDisplay ?? null,
          targetAmountDisplay: entry.targetAmountDisplay ?? null,
          targetAmountUsd: entry.targetAmountUsd ?? null,
        }))
        .reverse(),
    [state.feedEntries, todayKey],
  );

  const walletLabel = walletAddress ? compactAddress(walletAddress) : 'Not active yet';

  const refreshBalances = useCallback(async () => {
    if (!account) {
      setBalances([]);
      setBalancesError(null);
      setBalancesLoading(false);
      return;
    }

    setBalancesLoading(true);
    setBalancesError(null);

    try {
      const nextBalances = await getPocketPigBalances(account);
      setBalances(nextBalances);
    } catch (error) {
      setBalancesError(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while reading balances.',
      );
    } finally {
      setBalancesLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  const refreshFeedPreview = useCallback(async () => {
    try {
      setFeedPreviewLoading(true);
      setFeedPreviewError(null);
      const nextPreview = await getPocketPigFeedPreview({
        walletAddress,
        mode: state.mode,
        growAmount: state.dailyAmount,
        targetUsdAmount: state.targetUsdAmount,
        ethAmount: state.ethAmount,
        bitcoinAmount: state.bitcoinAmount,
      });
      setFeedPreview(nextPreview);
    } catch (error) {
      setFeedPreview(null);
      setFeedPreviewError(
        error instanceof Error ? error.message : 'Live quote could not be loaded.',
      );
    } finally {
      setFeedPreviewLoading(false);
    }
  }, [state.bitcoinAmount, state.dailyAmount, state.ethAmount, state.mode, state.targetUsdAmount, walletAddress]);

  useEffect(() => {
    void refreshFeedPreview();
  }, [refreshFeedPreview]);

  const refreshMarketOverview = useCallback(async () => {
    setMarketLoading(true);
    setMarketError(null);

    try {
      const nextOverview = await fetchMarketOverview();
      setMarketOverview(nextOverview);
    } catch (error) {
      setMarketError(
        error instanceof Error
          ? error.message
          : 'Live market data could not be loaded.',
      );
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMarketOverview();

    const intervalId = window.setInterval(() => {
      void refreshMarketOverview();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshMarketOverview]);

  const refreshSafePosition = useCallback(async () => {
    if (!account) {
      setSafePosition(null);
      setSafePositionError(null);
      setSafePositionLoading(false);
      return;
    }

    setSafePositionLoading(true);
    setSafePositionError(null);
    try {
      const nextPosition = await getPocketPigSafePosition(account);
      setSafePosition(nextPosition);
    } catch (error) {
      setSafePositionError(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while reading the Vesu position.',
      );
      setSafePosition(null);
    } finally {
      setSafePositionLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void refreshSafePosition();
  }, [refreshSafePosition]);

  const refreshEthPosition = useCallback(async () => {
    if (!account) {
      setEthPosition(null);
      setEthPositionError(null);
      setEthPositionLoading(false);
      return;
    }

    setEthPositionLoading(true);
    setEthPositionError(null);
    try {
      const nextPosition = await getPocketPigEthPosition(account);
      setEthPosition(nextPosition);
    } catch (error) {
      setEthPositionError(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while reading the ETH Vesu position.',
      );
      setEthPosition(null);
    } finally {
      setEthPositionLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void refreshEthPosition();
  }, [refreshEthPosition]);

  const refreshPositions = useCallback(async () => {
    if (!account) {
      setStakingPositions([]);
      setPositionsError(null);
      setPositionsLoading(false);
      return;
    }

    setPositionsLoading(true);
    setPositionsError(null);
    try {
      const nextPositions = await getPocketPigStakingPositions(account);
      setStakingPositions(nextPositions);
    } catch (error) {
      setPositionsError(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while reading staking positions.',
      );
      setStakingPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void refreshPositions();
  }, [refreshPositions]);

  useEffect(() => {
    if (!isHydrated || stateLoading || (!walletAddress && !userId)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void syncPocketPigState({
        user: {
          userId,
          walletAddress,
          providerKind,
          userName,
          userEmail,
          referralCode: state.referralCode,
        },
        settings: {
          mode: state.mode,
          growAmount: state.dailyAmount,
          ethAmount: state.ethAmount,
          bitcoinAmount: state.bitcoinAmount,
          usdcAmount: state.targetUsdAmount,
          notifications: state.notifications,
          autoFeed: state.autoFeed,
          pigSkin: state.pigSkin,
        },
        progress: {
          xp,
          lifetimeXp: xp,
          streak,
          longestStreak,
          level,
          totalSaved,
          fedToday,
        },
        balances: balances.map((balance) => ({
          assetSymbol: balance.symbol,
          amount: balance.displayAmount,
          rawAmount: balance.rawAmount.toString(),
        })),
        positions: [
          ...stakingPositions.map((position) => ({
            positionKey: position.id,
            protocol: 'native-staking',
            mode: position.mode,
            assetSymbol: position.tokenSymbol,
            amount: position.stakedDisplay,
            rewards: position.rewardsDisplay,
            unpooling: position.unpoolingDisplay,
            metadata: {
              validatorLabel: position.validatorLabel,
              poolAddress: position.poolAddress,
              tokenAddress: position.tokenAddress,
              unpoolTime: position.unpoolTime,
            },
          })),
          {
            positionKey: 'safe',
            protocol: 'vesu',
            mode: 'safe' as const,
            assetSymbol: safePosition?.assetSymbol ?? 'USDC',
            amount: safePosition?.suppliedDisplay ?? '0',
            rewards: null,
            unpooling: null,
            metadata: {
              poolLabel: safePosition?.poolLabel ?? 'Genesis Pool',
              protocolLabel: safePosition?.protocolLabel ?? 'Vesu',
              withdrawable: safePosition?.maxWithdrawDisplay ?? '0',
              vTokenAddress: safePosition?.vTokenAddress ?? null,
            },
          },
          {
            positionKey: 'eth',
            protocol: 'vesu',
            mode: 'eth' as const,
            assetSymbol: ethPosition?.assetSymbol ?? 'ETH',
            amount: ethPosition?.suppliedDisplay ?? '0',
            rewards: null,
            unpooling: null,
            metadata: {
              poolLabel: ethPosition?.poolLabel ?? 'Genesis Pool',
              protocolLabel: ethPosition?.protocolLabel ?? 'Vesu',
              withdrawable: ethPosition?.maxWithdrawDisplay ?? '0',
              vTokenAddress: ethPosition?.vTokenAddress ?? null,
            },
          },
        ],
        feedEvents: state.feedEntries
          .filter((entry) => entry.txHash)
          .slice(-50)
          .map((entry) => ({
            txHash: entry.txHash!,
            date: entry.date,
            mode: entry.mode,
            amount: entry.amount,
            xp: entry.xp,
            eventType: entry.eventType ?? 'feed',
            protocol: entry.protocol ?? null,
            cadence: entry.cadence ?? null,
            iterations: entry.iterations ?? null,
            orderAddress: entry.orderAddress ?? null,
            assetSymbol: entry.assetSymbol ?? null,
            usdValue: entry.usdValue ?? null,
            priceUsd: entry.priceUsd ?? null,
            feeBps: entry.feeBps ?? null,
            feeAmountDisplay: entry.feeAmountDisplay ?? null,
            feeAmountUsd: entry.feeAmountUsd ?? null,
            sourceAmountDisplay: entry.sourceAmountDisplay ?? null,
            targetSymbol: entry.targetSymbol ?? null,
            targetAmountDisplay: entry.targetAmountDisplay ?? null,
            targetAmountUsd: entry.targetAmountUsd ?? null,
          })),
      })
        .then((result) => {
          setSyncError(null);
          if (result.configured) {
            void refreshMarketOverview();
          }
        })
        .catch((error) => {
          setSyncError(
            error instanceof Error
              ? error.message
              : 'Supabase sync failed.',
          );
        });
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    balances,
    fedToday,
    isHydrated,
    level,
    longestStreak,
    providerKind,
    ethPosition,
    refreshMarketOverview,
    safePosition,
    state.autoFeed,
    state.bitcoinAmount,
    state.dailyAmount,
    state.ethAmount,
    state.feedEntries,
    state.mode,
    state.notifications,
    state.pigSkin,
    state.referralCode,
    state.targetUsdAmount,
    stakingPositions,
    streak,
    totalSaved,
    userEmail,
    userId,
    userName,
    walletAddress,
    xp,
    stateLoading,
  ]);

  const feed = async () => {
    if (!account) {
      setFeedError('An active Starknet account is required for onchain actions.');
      return false;
    }

    setFeedPending(true);
    setFeedError(null);
    setLastTransactionHash(null);
    setLastTransactionLabel(null);
    setLastAwardedXp(0);

    try {
      const today = todayKey;
      const result = await executePocketPigFeed({
        account,
        mode: state.mode,
        growAmount: state.dailyAmount,
        targetUsdAmount: state.targetUsdAmount,
        ethAmount: state.ethAmount,
        bitcoinAmount: state.bitcoinAmount,
      });

      const nextEntry = buildRewardedEntry({
        existingEntries: state.feedEntries,
        todayKey: today,
        baseEntry: {
          date: today,
          amount: result.sourceAmount,
          mode: state.mode,
          xp: 0,
          eventType: 'feed',
          txHash: result.transactionHash,
          protocol: getProtocolLabelForMode(state.mode),
          assetSymbol: result.assetSymbol,
          usdValue: result.usdValue,
          priceUsd: result.priceUsd,
          feeBps: result.feeBps,
          feeAmountDisplay: result.feeAmountDisplay,
          feeAmountUsd: result.feeAmountUsd,
          targetSymbol: result.targetSymbol,
          sourceAmountDisplay: result.sourceAmountDisplay,
          targetAmountDisplay: result.targetAmountDisplay,
          targetAmountUsd: result.targetAmountUsd,
        },
      });

      setState((current) => ({
        ...current,
        feedEntries: [
          ...current.feedEntries,
          nextEntry,
        ],
      }));
      setLastTransactionHash(result.transactionHash);
      setLastTransactionLabel(result.explorerLabel);
      setLastAwardedXp(nextEntry.xp);
      await refreshBalances();
      await refreshSafePosition();
      await refreshEthPosition();
      await refreshPositions();
      await refreshFeedPreview();
      await refreshMarketOverview();
      return true;
    } catch (error) {
      setFeedError(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during the onchain feed action.',
      );
      return false;
    } finally {
      setFeedPending(false);
    }
  };

  const withdrawSafePosition = useCallback(async () => {
    if (!account || !safePosition) {
      throw new Error('No active Vesu USDC position was found.');
    }

    setSafeActionPending(true);
    setSafePositionError(null);
    try {
      await withdrawPocketPigSafePosition({ account, position: safePosition });
      await refreshSafePosition();
      await refreshBalances();
      await refreshMarketOverview();
    } catch (error) {
      setSafePositionError(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during the USDC withdraw flow.',
      );
      throw error;
    } finally {
      setSafeActionPending(false);
    }
  }, [account, refreshBalances, refreshMarketOverview, refreshSafePosition, safePosition]);

  const withdrawEthPosition = useCallback(async () => {
    if (!account || !ethPosition) {
      throw new Error('No active Vesu ETH position was found.');
    }

    setSafeActionPending(true);
    setEthPositionError(null);
    try {
      await withdrawPocketPigSafePosition({ account, position: ethPosition });
      await refreshEthPosition();
      await refreshBalances();
      await refreshMarketOverview();
    } catch (error) {
      setEthPositionError(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during the ETH withdraw flow.',
      );
      throw error;
    } finally {
      setSafeActionPending(false);
    }
  }, [account, ethPosition, refreshBalances, refreshEthPosition, refreshMarketOverview]);

  const claimPositionRewards = useCallback(
    async (positionId: string) => {
      if (!account) {
        throw new Error('An active Starknet account is required.');
      }

      const position = stakingPositions.find((item) => item.id === positionId);
      if (!position) {
        throw new Error('Staking position could not be found.');
      }

      setPositionActionId(positionId);
      setPositionsError(null);
      try {
        await claimPocketPigStakeRewards({ account, position });
        await refreshPositions();
        await refreshBalances();
        await refreshMarketOverview();
      } catch (error) {
        setPositionsError(
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during the claim flow.',
        );
        throw error;
      } finally {
        setPositionActionId(null);
      }
    },
    [account, refreshBalances, refreshMarketOverview, refreshPositions, stakingPositions],
  );

  const unstakePosition = useCallback(
    async (positionId: string) => {
      if (!account) {
        throw new Error('An active Starknet account is required.');
      }

      const position = stakingPositions.find((item) => item.id === positionId);
      if (!position) {
        throw new Error('Staking position could not be found.');
      }

      setPositionActionId(positionId);
      setPositionsError(null);
      try {
        await unstakePocketPigPosition({ account, position });
        await refreshPositions();
        await refreshBalances();
        await refreshMarketOverview();
      } catch (error) {
        setPositionsError(
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during the unstake flow.',
        );
        throw error;
      } finally {
        setPositionActionId(null);
      }
    },
    [account, refreshBalances, refreshMarketOverview, refreshPositions, stakingPositions],
  );

  const recordDcaOrderCreated = useCallback(
    (params: {
      txHash: string;
      mode: Exclude<SavingMode, 'safe'>;
      assetSymbol: 'STRK' | 'BTC' | 'ETH';
      cadence: 'daily' | 'weekly';
      usdcPerCycle: number;
      iterations: number;
      orderAddress?: string | null;
    }) => {
      const today = todayKey;
      const usdValue = Number((params.usdcPerCycle * params.iterations).toFixed(2));
      const nextEntry = buildRewardedEntry({
        existingEntries: state.feedEntries,
        todayKey: today,
        baseEntry: {
          date: today,
          amount: params.usdcPerCycle,
          mode: params.mode,
          xp: 0,
          eventType: 'dca_create',
          txHash: params.txHash,
          protocol: 'AVNU DCA',
          cadence: params.cadence,
          iterations: params.iterations,
          orderAddress: params.orderAddress ?? null,
          assetSymbol: params.assetSymbol,
          usdValue,
          priceUsd: null,
          sourceAmountDisplay: `${params.usdcPerCycle.toFixed(2)} USDC`,
          targetSymbol: params.assetSymbol,
          targetAmountDisplay: `${params.iterations} ${params.cadence === 'daily' ? 'daily' : 'weekly'} buys`,
          targetAmountUsd: usdValue,
        },
      });

      setState((current) => ({
        ...current,
        feedEntries: [...current.feedEntries, nextEntry],
      }));
      setLastTransactionHash(params.txHash);
      setLastTransactionLabel(`Create ${params.assetSymbol} DCA`);
      setLastAwardedXp(nextEntry.xp);
    },
    [state.feedEntries, todayKey],
  );

  return (
    <AppContext.Provider
      value={{
        isOnboarded: state.isOnboarded,
        setIsOnboarded: (value) =>
          setState((current) => ({
            ...current,
            isOnboarded: value,
          })),
        mode: state.mode,
        setMode: (mode) =>
          setState((current) => ({
            ...current,
            mode,
          })),
        dailyAmount: state.dailyAmount,
        setDailyAmount: (amount) =>
          setState((current) => ({
            ...current,
            dailyAmount: Math.max(0, amount),
          })),
        targetUsdAmount: state.targetUsdAmount,
        setTargetUsdAmount: (amount) =>
          setState((current) => ({
            ...current,
            targetUsdAmount: Math.max(0, amount),
          })),
        ethAmount: state.ethAmount,
        setEthAmount: (amount) =>
          setState((current) => ({
            ...current,
            ethAmount: Math.max(0, amount),
          })),
        bitcoinAmount: state.bitcoinAmount,
        setBitcoinAmount: (amount) =>
          setState((current) => ({
            ...current,
            bitcoinAmount: Math.max(0, Number(amount.toFixed(8))),
          })),
        streak,
        xp,
        level,
        xpToNextLevel,
        lastAwardedXp,
        nextFeedXpPreview,
        currentLevelXp,
        currentLevelCap,
        levelTitle,
        levelProgressPercent,
        lastFeedXp,
        fedToday,
        totalSaved,
        totalFeedCount,
        badges,
        missions,
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
        refreshMarketOverview,
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
        notifications: state.notifications,
        setNotifications: (value) =>
          setState((current) => ({
            ...current,
            notifications: value,
          })),
        autoFeed: state.autoFeed,
        setAutoFeed: (value) =>
          setState((current) => ({
            ...current,
            autoFeed: value,
          })),
        weeklyProgress,
        weeklyTarget,
        userName,
        userEmail,
        pigSkin: state.pigSkin,
        setPigSkin: (skin) =>
          setState((current) => ({
            ...current,
            pigSkin: skin,
          })),
        referralCode: state.referralCode,
        weekHistory,
        monthHistory,
        savingsSeries,
        todaysFeeds,
        authReady,
        authConfigured,
        privyConfigured,
        authenticated,
        providerKind,
        walletAddress,
        walletSourceLabel,
        walletStatus,
        walletDeployed,
        walletError,
        canActivateWallet,
        walletReadyForTransactions,
        availableNativeWallets,
        nativeWalletsLoading,
        nativeWalletPendingId,
        loginWith,
        loginWithCartridge,
        connectNativeWallet,
        refreshNativeWallets,
        activateWallet,
        logout,
        walletLabel,
        recordDcaOrderCreated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
};
