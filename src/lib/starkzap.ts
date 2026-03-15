import { StarkZap } from '../vendor/starkzap/sdk'
import { networks } from '../vendor/starkzap/networks'
import { OnboardStrategy } from '../vendor/starkzap/onboard'

const requestedNetwork = import.meta.env.VITE_STARKZAP_NETWORK

export const previewNetwork =
  requestedNetwork === 'sepolia' ? 'sepolia' : 'mainnet'

const previewSdk = new StarkZap({
  network: previewNetwork,
  rpcUrl:
    import.meta.env.VITE_STARKNET_RPC_URL?.trim() ??
    (requestedNetwork === 'sepolia'
      ? 'https://rpc.starknet-sepolia.lava.build'
      : 'https://rpc.starknet.lava.build'),
  ...(import.meta.env.VITE_AVNU_PAYMASTER_API_KEY?.trim()
    ? {
        paymaster: {
          nodeUrl:
            import.meta.env.VITE_AVNU_PAYMASTER_NODE_URL?.trim() ??
            (requestedNetwork === 'sepolia'
              ? 'https://sepolia.paymaster.avnu.fi'
              : 'https://starknet.paymaster.avnu.fi'),
          headers: {
            'x-paymaster-api-key': import.meta.env.VITE_AVNU_PAYMASTER_API_KEY.trim(),
          },
        },
      }
    : {}),
})

export const installCommand = 'npm install starkzap @cartridge/controller'
export const installedVersion = '1.0.0'
export const sdkClassName = StarkZap.name
export const providerClassName = previewSdk.getProvider().constructor.name

export const productName = 'PocketPig'
export const productTagline =
  'Feed your digital piggy bank with one tap a day, build streaks, and earn XP.'

export const productPitch =
  'PocketPig is not a DeFi terminal. It is a mobile-first savings ritual with social login and one simple daily action.'

export const primaryCta = 'Make today’s deposit'
export const starterGoal = '$5 daily goal'
export const previewStats = [
  { label: 'Current streak', value: '12 days' },
  { label: 'Today reward', value: '+10 XP' },
  { label: 'Piggy level', value: 'Lv. 4' },
  { label: 'Wallet mode', value: OnboardStrategy.Privy },
] as const

export const savingModes = [
  {
    title: 'Safe',
    accent: 'USDC',
    description:
      'A simpler daily savings flow where users just feed the piggy while stablecoin savings grow in the background.',
  },
  {
    title: 'Bitcoin',
    accent: 'BTC',
    description:
      'Route daily savings into a BTC wrapper and stake it through the Nansen validator path.',
  },
  {
    title: 'Grow',
    accent: 'STRK',
    description:
      'A higher-conviction mode that routes STRK into staking.',
  },
] as const

export const dailyLoop = [
  {
    title: '1. Sign in',
    description:
      'Enter with social login or a wallet connection, without exposing users to seed phrases.',
  },
  {
    title: '2. Feed the piggy',
    description:
      'The daily amount is already set, so users complete today’s action with a single button press.',
  },
  {
    title: '3. Earn XP and streaks',
    description:
      'Levels, XP, and badges grow over time without exposing users to cluttered finance dashboards.',
  },
] as const

export const xpRules = [
  { title: 'Daily check-in', value: '+10 XP' },
  { title: '3-day streak', value: '+20 XP' },
  { title: '7-day streak', value: '+75 XP' },
  { title: 'Weekly goal', value: '+50 XP' },
] as const

export const badgeShelf = [
  'Patient Pig',
  '7-Day Streak',
  'Safe Saver',
  'Bitcoin Believer',
  'STRK Builder',
] as const

export const monetizationCards = [
  {
    title: 'Automatic feed',
    description:
      'In a later phase, users can turn on scheduled automatic savings based on their own cadence.',
  },
  {
    title: 'Skin packs',
    description:
      'Piggy themes, room backgrounds, and seasonal looks can be monetized without hurting the product feel.',
  },
  {
    title: 'Sponsored challenges',
    description:
      'Partner campaigns can unlock weekly challenges that reward users and generate revenue.',
  },
] as const

export const guardrails = [
  'There should be only one primary daily action.',
  'There will be no custom token in the first release.',
  'XP will never act as money.',
  'XP may become a community signal in the future, but no guaranteed rewards are promised.',
  'Users should not be forced to choose protocols.',
  'Every main action must be easy to perform with one hand on mobile.',
] as const

export const buildScope = [
  'Home: piggy, streak ring, and today button',
  'Progress: level, XP, badges, and 7-day / 30-day progress',
  'Profile: daily amount, asset selection, and account controls',
] as const

export const references = [
  {
    label: 'Wallets',
    href: 'https://docs.starknet.io/build/starkzap/connecting-wallets',
    note: 'Privy and social onboarding fit naturally here.',
  },
  {
    label: 'Paymasters',
    href: 'https://docs.starknet.io/build/starkzap/paymasters',
    note: 'This is the right surface for gasless first actions.',
  },
  {
    label: 'Staking',
    href: 'https://docs.starknet.io/build/starkzap/staking',
    note: 'Core staking helpers for the STRK flow.',
  },
  {
    label: 'AVNU API',
    href: 'https://docs.avnu.fi/api/overview',
    note: 'Useful for expanding swap, DCA, and sponsored transaction flows.',
  },
] as const

export const techFit = [
  {
    title: 'SDK runtime',
    value: sdkClassName,
  },
  {
    title: 'Provider',
    value: providerClassName,
  },
  {
    title: 'Preview network',
    value: networks[previewNetwork].name,
  },
  {
    title: 'Install',
    value: installCommand,
  },
] as const
