import type { SavingMode, Badge, MissionCard } from '../app/context/AppContext';

export interface ProgressionFeedEntry {
  date: string;
  mode: SavingMode;
  xp: number;
  usdValue?: number | null;
  eventType?: 'feed' | 'dca_create';
  assetSymbol?: string | null;
}

export interface LevelProgress {
  level: number;
  lifetimeXp: number;
  currentLevelXp: number;
  currentLevelCap: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpAwarded: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Mythic';
  goalLabel: string;
}

type BadgeSnapshot = {
  unlockedAt?: string;
  progress: number;
  target: number;
};

const STREAK_BONUS_TABLE: Record<number, number> = {
  3: 20,
  7: 50,
  14: 100,
  30: 250,
  90: 600,
  180: 1400,
  365: 4000,
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'streak-7',
    name: 'Hot Week',
    description: 'Keep a live streak for 7 straight days.',
    icon: 'HW',
    xpAwarded: 90,
    tier: 'Bronze',
    goalLabel: '7-day streak',
  },
  {
    id: 'discipline-30',
    name: 'Unbroken Month',
    description: 'Log at least one onchain action for 30 straight days.',
    icon: '30',
    xpAwarded: 320,
    tier: 'Silver',
    goalLabel: '30-day streak',
  },
  {
    id: 'discipline-100',
    name: 'Centurion',
    description: 'Hold a 100-day streak without breaking it.',
    icon: '100',
    xpAwarded: 1400,
    tier: 'Gold',
    goalLabel: '100-day streak',
  },
  {
    id: 'volume-1k',
    name: 'Four Figures',
    description: 'Route a combined $1,000 through PocketPig.',
    icon: '$1K',
    xpAwarded: 300,
    tier: 'Bronze',
    goalLabel: '$1,000 routed',
  },
  {
    id: 'volume-10k',
    name: 'Deep Stack',
    description: 'Route a combined $10,000 through PocketPig.',
    icon: '$10K',
    xpAwarded: 1800,
    tier: 'Gold',
    goalLabel: '$10,000 routed',
  },
  {
    id: 'feeds-50',
    name: 'Machine Mode',
    description: 'Complete 50 total PocketPig actions.',
    icon: '50',
    xpAwarded: 450,
    tier: 'Silver',
    goalLabel: '50 actions',
  },
  {
    id: 'feeds-200',
    name: 'PocketPig Max',
    description: 'Complete 200 total PocketPig actions.',
    icon: '200',
    xpAwarded: 2400,
    tier: 'Mythic',
    goalLabel: '200 actions',
  },
  {
    id: 'asset-all',
    name: 'Full Spectrum',
    description: 'Use USDC, BTC, ETH, and STRK at least once.',
    icon: 'ALL',
    xpAwarded: 500,
    tier: 'Silver',
    goalLabel: '4 assets used',
  },
  {
    id: 'strk-veteran',
    name: 'STRK Veteran',
    description: 'Stake STRK on 20 different days.',
    icon: 'STRK',
    xpAwarded: 650,
    tier: 'Gold',
    goalLabel: '20 STRK days',
  },
  {
    id: 'bitcoin-conviction',
    name: 'Bitcoin Conviction',
    description: 'Stake BTC on 20 different days.',
    icon: 'BTC',
    xpAwarded: 650,
    tier: 'Gold',
    goalLabel: '20 BTC days',
  },
  {
    id: 'eth-earner',
    name: 'ETH Earner',
    description: 'Supply ETH on 20 different days.',
    icon: 'ETH',
    xpAwarded: 650,
    tier: 'Gold',
    goalLabel: '20 ETH days',
  },
  {
    id: 'usdc-steward',
    name: 'USDC Steward',
    description: 'Supply USDC on 20 different days.',
    icon: 'USDC',
    xpAwarded: 650,
    tier: 'Gold',
    goalLabel: '20 USDC days',
  },
  {
    id: 'dca-starter',
    name: 'Recurring Builder',
    description: 'Create your first 3 DCA plans.',
    icon: 'DCA',
    xpAwarded: 350,
    tier: 'Silver',
    goalLabel: '3 DCA plans',
  },
];

function dateKeyToUtc(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).getTime();
}

function diffDays(left: string, right: string) {
  return Math.round((dateKeyToUtc(left) - dateKeyToUtc(right)) / 86_400_000);
}

function normalizeUsdValue(entry: ProgressionFeedEntry) {
  return Math.max(0, Number(entry.usdValue ?? 0));
}

function getUniqueEntryDaysByMode(feedEntries: ProgressionFeedEntry[]) {
  return {
    safe: new Set(feedEntries.filter((entry) => entry.mode === 'safe').map((entry) => entry.date)),
    bitcoin: new Set(feedEntries.filter((entry) => entry.mode === 'bitcoin').map((entry) => entry.date)),
    grow: new Set(feedEntries.filter((entry) => entry.mode === 'grow').map((entry) => entry.date)),
    eth: new Set(feedEntries.filter((entry) => entry.mode === 'eth').map((entry) => entry.date)),
  };
}

export function getDailyBaseXp(level: number) {
  return 40 + Math.floor(Math.max(0, level - 1) / 5) * 5;
}

export function getVolumeXp(usdValue: number) {
  return Math.min(60, Math.floor(Math.max(0, usdValue) / 5) * 2);
}

export function getStreakBonus(streak: number) {
  return STREAK_BONUS_TABLE[streak] ?? 0;
}

export function getCommitmentBonus(entry: ProgressionFeedEntry) {
  return entry.eventType === 'dca_create' ? 35 : 0;
}

export function getDiversityBonus(
  existingEntries: ProgressionFeedEntry[],
  nextEntry: ProgressionFeedEntry,
) {
  const recentUniqueDays = Array.from(
    new Set(existingEntries.map((entry) => entry.date)),
  )
    .sort()
    .slice(-7);

  const recentModes = new Set(
    existingEntries
      .filter((entry) => recentUniqueDays.includes(entry.date))
      .map((entry) => entry.mode),
  );

  return recentModes.has(nextEntry.mode) ? 0 : 15;
}

export function getXpRequiredForLevel(level: number) {
  return Math.max(120, Math.round(120 * level ** 1.18 + 40 * level));
}

export function resolveInfiniteLevel(totalXp: number): LevelProgress {
  let remaining = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let currentLevelCap = getXpRequiredForLevel(level);

  while (remaining >= currentLevelCap) {
    remaining -= currentLevelCap;
    level += 1;
    currentLevelCap = getXpRequiredForLevel(level);
  }

  return {
    level,
    lifetimeXp: Math.max(0, Math.floor(totalXp)),
    currentLevelXp: remaining,
    currentLevelCap,
    xpToNextLevel: currentLevelCap - remaining,
    progressPercent: currentLevelCap > 0 ? (remaining / currentLevelCap) * 100 : 0,
  };
}

export function computeDailyStreak(feedEntries: ProgressionFeedEntry[], todayKey: string) {
  const uniqueDates = Array.from(new Set(feedEntries.map((entry) => entry.date))).sort();
  if (!uniqueDates.length) {
    return 0;
  }

  const anchor =
    uniqueDates.includes(todayKey) ? todayKey : uniqueDates[uniqueDates.length - 1];

  if (diffDays(todayKey, anchor) > 1) {
    return 0;
  }

  let streak = 1;
  for (let index = uniqueDates.length - 1; index > 0; index -= 1) {
    if (diffDays(uniqueDates[index], uniqueDates[index - 1]) === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

export function computeLongestStreak(feedEntries: ProgressionFeedEntry[]) {
  const uniqueDates = Array.from(new Set(feedEntries.map((entry) => entry.date))).sort();
  if (!uniqueDates.length) {
    return 0;
  }

  let longest = 1;
  let current = 1;
  for (let index = 1; index < uniqueDates.length; index += 1) {
    if (diffDays(uniqueDates[index], uniqueDates[index - 1]) === 1) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }

  return longest;
}

function buildBadgeSnapshots(feedEntries: ProgressionFeedEntry[]) {
  const sortedEntries = [...feedEntries].sort((left, right) => left.date.localeCompare(right.date));
  const unlocked = new Map<string, BadgeSnapshot>();
  let totalVolumeUsd = 0;
  let totalActions = 0;
  let dcaPlans = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let previousDay: string | null = null;
  const modeDays = getUniqueEntryDaysByMode(sortedEntries);
  const assetsUsed = new Set<SavingMode>();

  for (const entry of sortedEntries) {
    totalVolumeUsd += normalizeUsdValue(entry);
    totalActions += 1;
    assetsUsed.add(entry.mode);
    if (entry.eventType === 'dca_create') {
      dcaPlans += 1;
    }

    if (entry.date !== previousDay) {
      if (!previousDay) {
        currentStreak = 1;
      } else if (diffDays(entry.date, previousDay) === 1) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      previousDay = entry.date;
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    const checks: Array<[string, number, number, boolean]> = [
      ['streak-7', Math.min(longestStreak, 7), 7, longestStreak >= 7],
      ['discipline-30', Math.min(longestStreak, 30), 30, longestStreak >= 30],
      ['discipline-100', Math.min(longestStreak, 100), 100, longestStreak >= 100],
      ['volume-1k', Math.min(totalVolumeUsd, 1_000), 1_000, totalVolumeUsd >= 1_000],
      ['volume-10k', Math.min(totalVolumeUsd, 10_000), 10_000, totalVolumeUsd >= 10_000],
      ['feeds-50', Math.min(totalActions, 50), 50, totalActions >= 50],
      ['feeds-200', Math.min(totalActions, 200), 200, totalActions >= 200],
      ['asset-all', Math.min(assetsUsed.size, 4), 4, assetsUsed.size >= 4],
      ['strk-veteran', Math.min(modeDays.grow.size, 20), 20, modeDays.grow.size >= 20],
      ['bitcoin-conviction', Math.min(modeDays.bitcoin.size, 20), 20, modeDays.bitcoin.size >= 20],
      ['eth-earner', Math.min(modeDays.eth.size, 20), 20, modeDays.eth.size >= 20],
      ['usdc-steward', Math.min(modeDays.safe.size, 20), 20, modeDays.safe.size >= 20],
      ['dca-starter', Math.min(dcaPlans, 3), 3, dcaPlans >= 3],
    ];

    for (const [badgeId, progress, target, earned] of checks) {
      const snapshot = unlocked.get(badgeId);
      const unlockedAt = earned ? snapshot?.unlockedAt ?? entry.date : snapshot?.unlockedAt;
      unlocked.set(badgeId, {
        progress,
        target,
        unlockedAt,
      });
    }
  }

  if (!sortedEntries.length) {
    for (const [badgeId, target] of [
      ['streak-7', 7],
      ['discipline-30', 30],
      ['discipline-100', 100],
      ['volume-1k', 1_000],
      ['volume-10k', 10_000],
      ['feeds-50', 50],
      ['feeds-200', 200],
      ['asset-all', 4],
      ['strk-veteran', 20],
      ['bitcoin-conviction', 20],
      ['eth-earner', 20],
      ['usdc-steward', 20],
      ['dca-starter', 3],
    ] as const) {
      unlocked.set(badgeId, { progress: 0, target });
    }
  }

  return unlocked;
}

export function buildBadges(feedEntries: ProgressionFeedEntry[]): Badge[] {
  const snapshots = buildBadgeSnapshots(feedEntries);

  return BADGE_DEFINITIONS.map((definition) => {
    const snapshot = snapshots.get(definition.id) ?? { progress: 0, target: 1 };
    const earned = Boolean(snapshot.unlockedAt);

    return {
      ...definition,
      earned,
      earnedDate: snapshot.unlockedAt,
      progress: snapshot.progress,
      target: snapshot.target,
      progressLabel: `${Math.floor(snapshot.progress).toLocaleString()} / ${Math.floor(
        snapshot.target,
      ).toLocaleString()}`,
    };
  });
}

export function getBadgeBonusForNextFeed(
  existingEntries: ProgressionFeedEntry[],
  nextEntry: ProgressionFeedEntry,
) {
  const before = buildBadgeSnapshots(existingEntries);
  const after = buildBadgeSnapshots([...existingEntries, nextEntry]);

  return BADGE_DEFINITIONS.filter((badge) => {
    const previous = before.get(badge.id);
    const next = after.get(badge.id);
    return !previous?.unlockedAt && Boolean(next?.unlockedAt);
  }).reduce((sum, badge) => sum + badge.xpAwarded, 0);
}

export function buildMissionCards(
  feedEntries: ProgressionFeedEntry[],
  todayKey: string,
  streak: number,
): MissionCard[] {
  const todayEntries = feedEntries.filter((entry) => entry.date === todayKey);
  const last7Days = Array.from(new Set(feedEntries.map((entry) => entry.date))).sort().slice(-7);
  const weeklyActiveDays = last7Days.length;
  const uniqueModes = new Set(feedEntries.map((entry) => entry.mode)).size;
  const dcaPlans = feedEntries.filter((entry) => entry.eventType === 'dca_create').length;

  return [
    {
      id: 'daily-feed',
      title: 'Daily action',
      description: 'Complete one onchain action today.',
      progress: Math.min(todayEntries.length, 1),
      target: 1,
      xpReward: 40,
      complete: todayEntries.length > 0,
    },
    {
      id: 'weekly-consistency',
      title: 'Weekly consistency',
      description: 'Stay active on 5 different days this week.',
      progress: Math.min(weeklyActiveDays, 5),
      target: 5,
      xpReward: 120,
      complete: weeklyActiveDays >= 5,
    },
    {
      id: 'asset-mix',
      title: 'Asset mix',
      description: 'Use all 4 PocketPig assets.',
      progress: Math.min(uniqueModes, 4),
      target: 4,
      xpReward: 200,
      complete: uniqueModes >= 4,
    },
    {
      id: 'dca-builder',
      title: 'DCA builder',
      description: 'Create 3 DCA plans.',
      progress: Math.min(dcaPlans, 3),
      target: 3,
      xpReward: 150,
      complete: dcaPlans >= 3,
    },
    {
      id: 'streak-push',
      title: 'Streak push',
      description: 'Reach the next streak milestone.',
      progress: streak < 7 ? streak : streak < 30 ? streak : streak < 100 ? streak : Math.min(streak, 365),
      target: streak < 7 ? 7 : streak < 30 ? 30 : streak < 100 ? 100 : 365,
      xpReward: streak < 7 ? 50 : streak < 30 ? 250 : streak < 100 ? 1400 : 4000,
      complete: false,
    },
  ];
}

export function getLevelTitle(level: number) {
  if (level >= 150) return 'Apex Treasurer';
  if (level >= 100) return 'Protocol Legend';
  if (level >= 70) return 'Vault Architect';
  if (level >= 45) return 'Yield Commander';
  if (level >= 25) return 'Capital Operator';
  if (level >= 12) return 'Chain Stacker';
  if (level >= 5) return 'Disciplined Saver';
  return 'Piglet';
}
