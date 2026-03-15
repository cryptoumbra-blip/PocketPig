import React, { createContext, useContext, useState, useCallback } from 'react';

export type SavingMode = 'safe' | 'bitcoin' | 'grow';

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
  earnedDate?: string;
}

interface AppState {
  isOnboarded: boolean;
  setIsOnboarded: (v: boolean) => void;
  mode: SavingMode;
  setMode: (m: SavingMode) => void;
  dailyAmount: number;
  setDailyAmount: (a: number) => void;
  streak: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  fedToday: boolean;
  totalSaved: number;
  badges: Badge[];
  feed: () => void;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  autoFeed: boolean;
  setAutoFeed: (v: boolean) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  weeklyProgress: number;
  weeklyTarget: number;
  userName: string;
  pigSkin: string;
  setPigSkin: (s: string) => void;
  referralCode: string;
  weekHistory: boolean[];
}

const AppContext = createContext<AppState | null>(null);

const initialBadges: Badge[] = [
  { id: '3-day-streak', name: '3-Day Streak', description: 'Save 3 days in a row', emoji: '🔥', earned: true, earnedDate: 'Mar 3' },
  { id: '7-day-streak', name: '7-Day Streak', description: 'Save 7 days in a row', emoji: '⚡', earned: true, earnedDate: 'Mar 7' },
  { id: 'safe-saver', name: 'Safe Saver', description: 'Choose USDC mode', emoji: '🛡️', earned: true, earnedDate: 'Feb 24' },
  { id: 'early-feeder', name: 'Early Feeder', description: 'First to join PocketPig', emoji: '🐣', earned: true, earnedDate: 'Feb 24' },
  { id: 'bitcoin-believer', name: 'Bitcoin Believer', description: 'Switch to Bitcoin mode', emoji: '₿', earned: false },
  { id: 'strk-builder', name: 'STRK Builder', description: 'Use Grow mode for 7 days', emoji: '🌱', earned: false },
  { id: '30-day-streak', name: '30-Day Streak', description: 'Save every day for a month', emoji: '💎', earned: false },
  { id: 'century', name: 'Century Club', description: 'Save $100 total', emoji: '💰', earned: true, earnedDate: 'Mar 1' },
  { id: 'social-pig', name: 'Social Pig', description: 'Refer 3 friends', emoji: '🐷', earned: false },
  { id: 'night-owl', name: 'Night Owl', description: 'Feed after midnight 5 times', emoji: '🦉', earned: false },
  { id: 'speed-saver', name: 'Speed Saver', description: 'Feed within 1 min of waking', emoji: '⚡', earned: false },
  { id: 'premium-pig', name: 'Premium Pig', description: 'Unlock Premium', emoji: '👑', earned: false },
];

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [mode, setMode] = useState<SavingMode>('safe');
  const [dailyAmount, setDailyAmount] = useState(5);
  const [streak, setStreak] = useState(12);
  const [xp, setXp] = useState(1240);
  const [level] = useState(4);
  const [xpToNextLevel] = useState(2000);
  const [fedToday, setFedToday] = useState(false);
  const [totalSaved, setTotalSaved] = useState(156.50);
  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [notifications, setNotifications] = useState(true);
  const [autoFeed, setAutoFeed] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [weeklyProgress] = useState(32);
  const [weeklyTarget] = useState(35);
  const [pigSkin, setPigSkin] = useState('classic');
  const weekHistory = [true, true, true, false, true, true, true];

  const feed = useCallback(() => {
    if (!fedToday) {
      setFedToday(true);
      setStreak(s => s + 1);
      setXp(x => x + 50);
      setTotalSaved(t => parseFloat((t + dailyAmount).toFixed(2)));
    }
  }, [fedToday, dailyAmount]);

  return (
    <AppContext.Provider value={{
      isOnboarded, setIsOnboarded,
      mode, setMode,
      dailyAmount, setDailyAmount,
      streak, xp, level, xpToNextLevel, fedToday, totalSaved, badges,
      feed,
      notifications, setNotifications,
      autoFeed, setAutoFeed,
      isPremium, setIsPremium,
      weeklyProgress, weeklyTarget,
      userName: 'Alex',
      pigSkin, setPigSkin,
      referralCode: 'PIGALEX42',
      weekHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
