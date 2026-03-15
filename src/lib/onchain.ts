import { StarkZap } from '../vendor/starkzap/sdk';
import { mainnetTokens } from '../vendor/starkzap/tokens-mainnet';
import { sepoliaTokens } from '../vendor/starkzap/tokens-sepolia';
import { mainnetValidators } from '../vendor/starkzap/validators-mainnet';
import { sepoliaValidators } from '../vendor/starkzap/validators-sepolia';
import { Contract, validateAndParseAddress } from 'starknet';
import type { AccountInterface, Call } from 'starknet';
import { ABI as ERC20_ABI } from '../../node_modules/starkzap/dist/src/abi/erc20.js';
import { ABI as POOL_ABI } from '../../node_modules/starkzap/dist/src/abi/pool.js';
import { appEnv } from './env';

type Token = {
  name: string;
  address: string;
  decimals: number;
  symbol: string;
  metadata?: {
    logoUrl?: URL;
  };
};

export type FeedMode = 'safe' | 'bitcoin' | 'grow' | 'eth';

interface FeedExecutionResult {
  transactionHash: string;
  assetSymbol: string;
  targetSymbol: string;
  explorerLabel: string;
  sourceAmount: number;
  sourceAmountDisplay: string;
  targetAmountDisplay: string;
  usdValue: number | null;
  priceUsd: number | null;
  feeBps: number;
  feeAmountDisplay: string;
  feeAmountUsd: number | null;
  targetAmountUsd: number | null;
}

export interface FeedPreview {
  sourceSymbol: string;
  sourceAmount: number;
  sourceAmountDisplay: string;
  targetSymbol: string;
  targetAmountDisplay: string;
  usdValue: number | null;
  targetAmountUsd: number | null;
  feeBps: number;
  feeAmountDisplay: string;
  feeAmountUsd: number | null;
  controlLabel: string;
  helperText: string;
}

export interface PocketPigBalance {
  symbol: string;
  address: string;
  decimals: number;
  rawAmount: bigint;
  formattedAmount: number;
  displayAmount: string;
}

export interface StakingPosition {
  id: string;
  mode: Extract<FeedMode, 'grow' | 'bitcoin'>;
  validatorLabel: string;
  poolAddress: string;
  tokenSymbol: string;
  tokenAddress: string;
  stakedRaw: bigint;
  stakedDisplay: string;
  rewardsRaw: bigint;
  rewardsDisplay: string;
  rewardsSymbol: string;
  unpoolingRaw: bigint;
  unpoolingDisplay: string;
  unpoolTime: string | null;
  canClaim: boolean;
  canUnstake: boolean;
  canCompleteExit: boolean;
}

export interface SupplyPosition {
  id: 'safe' | 'eth';
  mode: Extract<FeedMode, 'safe' | 'eth'>;
  protocolLabel: string;
  poolLabel: string;
  assetSymbol: string;
  assetAddress: string;
  vTokenAddress: string;
  suppliedRaw: bigint;
  suppliedDisplay: string;
  sharesRaw: bigint;
  sharesDisplay: string;
  maxWithdrawRaw: bigint;
  maxWithdrawDisplay: string;
  canWithdraw: boolean;
}

interface ValidatorCandidate {
  label: string;
  address: string;
}

const sdk = new StarkZap({
  network: appEnv.starkzapNetwork as 'mainnet' | 'sepolia',
  rpcUrl: appEnv.starknetRpcUrl,
  ...(appEnv.avnuPaymasterApiKey
    ? {
        paymaster: {
          nodeUrl: appEnv.avnuPaymasterNodeUrl,
          headers: {
            'x-paymaster-api-key': appEnv.avnuPaymasterApiKey,
          },
        },
      }
    : {}),
});

const DEFAULT_VALIDATOR_CANDIDATES: ValidatorCandidate[] =
  appEnv.starkzapNetwork === 'mainnet'
    ? [
        { label: 'AVNU', address: mainnetValidators.AVNU.stakerAddress },
        { label: 'Braavos', address: mainnetValidators.BRAAVOS.stakerAddress },
        {
          label: 'Ready',
          address: mainnetValidators.READY_PREV_ARGENT.stakerAddress,
        },
      ]
    : [
        { label: 'Nethermind', address: sepoliaValidators.NETHERMIND.stakerAddress },
        {
          label: 'Provalidator',
          address: sepoliaValidators.PROVALIDATOR.stakerAddress,
        },
        { label: 'Keplr', address: sepoliaValidators.KEPLR.stakerAddress },
      ];

const BITCOIN_VALIDATOR_CANDIDATES: ValidatorCandidate[] =
  appEnv.starkzapNetwork === 'mainnet'
    ? [{ label: 'Nansen', address: mainnetValidators.NANSEN.stakerAddress }]
    : DEFAULT_VALIDATOR_CANDIDATES;

function getNativeUsdcToken(): Token {
  if (appEnv.starkzapNetwork === 'mainnet') {
    return {
      name: 'USD Coin',
      address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
      decimals: 6,
      symbol: 'USDC',
    };
  }

  return {
    name: 'USD Coin',
    address: '0x27ef4670397069d7d5442cb7945b27338692de0d8896bdb15e6400cf5249f94',
    decimals: 6,
    symbol: 'USDC',
  };
}

const VESU_SUPPLY_CONFIG = {
  protocolLabel: 'Vesu',
  poolLabel: 'Genesis Pool',
  safe:
    appEnv.starkzapNetwork === 'mainnet'
      ? {
          token: () => getNativeUsdcToken(),
          vTokenAddress:
            '0x01610abab2ff987cdfb5e73cccbf7069cbb1a02bbfa5ee31d97cc30e29d89090',
        }
      : {
          token: () => getNativeUsdcToken(),
          vTokenAddress:
            '0x7632c8fab1399aede8ad1f89411f082b0a492ca58e87b5ebc475d38f799b0c7',
        },
  eth:
    appEnv.starkzapNetwork === 'mainnet'
      ? {
          token: () => getTokenCatalog().ETH,
          vTokenAddress:
            '0x021fe2ca1b7e731e4a5ef7df2881356070c5d72db4b2d19f9195f6b641f75df0',
        }
      : {
          token: () => getTokenCatalog().ETH,
          vTokenAddress:
            '0x1ceb6db3ac889e2c0d2881eff602117c340316e55436f37699d91c193ee8aa0',
        },
} as const;

const MIN_OPERATION_USD = 0;
const FEE_BPS: Record<FeedMode, number> = {
  grow: 0,
  bitcoin: 0,
  safe: 0,
  eth: 0,
};

const AVNU_TOKEN_BASE_URL =
  appEnv.starkzapNetwork === 'sepolia'
    ? 'https://sepolia.impulse.avnu.fi/v3/tokens'
    : 'https://starknet.impulse.avnu.fi/v3/tokens';

function getTokenCatalog() {
  return appEnv.starkzapNetwork === 'mainnet' ? mainnetTokens : sepoliaTokens;
}

function getSourceToken() {
  return getTokenCatalog().STRK;
}

function getUsdToken() {
  return getNativeUsdcToken();
}

function getTargetToken(mode: Exclude<FeedMode, 'grow' | 'eth'>): Token {
  const tokens = getTokenCatalog();
  if (mode === 'safe') {
    return getNativeUsdcToken();
  }

  return tokens.WBTC ?? tokens.TBTC ?? tokens.LBTC;
}

function getTokenByAddress(address: string) {
  const normalizedAddress = address.toLowerCase();
  return [getNativeUsdcToken(), ...Object.values(getTokenCatalog())].find(
    (token) => token.address.toLowerCase() === normalizedAddress,
  );
}

function toHex(value: bigint) {
  return `0x${value.toString(16)}`;
}

function toUint256Calldata(value: bigint) {
  const lowMask = (1n << 128n) - 1n;
  const low = value & lowMask;
  const high = value >> 128n;
  return [toHex(low), toHex(high)];
}

function amountToRaw(amount: number, decimals: number) {
  const normalized = amount.toFixed(Math.min(decimals, 6));
  const [wholePart, fractionPart = ''] = normalized.split('.');
  const paddedFraction = fractionPart.padEnd(decimals, '0').slice(0, decimals);
  const whole = BigInt(wholePart || '0');
  const fraction = BigInt(paddedFraction || '0');
  return whole * 10n ** BigInt(decimals) + fraction;
}

function parseUint256(result: string[]) {
  const low = BigInt(result[0] ?? '0');
  const high = BigInt(result[1] ?? '0');
  return low + (high << 128n);
}

function formatTokenAmount(rawAmount: bigint, decimals: number, precision = 4) {
  const divisor = 10n ** BigInt(decimals);
  const whole = rawAmount / divisor;
  const fraction = rawAmount % divisor;
  const fractionString = fraction
    .toString()
    .padStart(decimals, '0')
    .slice(0, precision)
    .replace(/0+$/, '');

  return fractionString ? `${whole.toString()}.${fractionString}` : whole.toString();
}

function rawToNumber(rawAmount: bigint, decimals: number, precision = 6) {
  return Number(formatTokenAmount(rawAmount, decimals, precision));
}

function bumpResourceValue(value: bigint, multiplierNumerator = 3n, multiplierDenominator = 2n) {
  const bumped = (value * multiplierNumerator) / multiplierDenominator;
  return bumped > value ? bumped : value + 1n;
}

function bumpResourceBounds(
  resourceBounds: {
    l1_gas?: { max_amount: bigint; max_price_per_unit: bigint };
    l2_gas?: { max_amount: bigint; max_price_per_unit: bigint };
    l1_data_gas?: { max_amount: bigint; max_price_per_unit: bigint };
  } | null | undefined,
) {
  if (!resourceBounds) {
    return undefined;
  }

  return {
    l1_gas: resourceBounds.l1_gas
      ? {
          max_amount: bumpResourceValue(resourceBounds.l1_gas.max_amount),
          max_price_per_unit: bumpResourceValue(resourceBounds.l1_gas.max_price_per_unit),
        }
      : undefined,
    l2_gas: resourceBounds.l2_gas
      ? {
          max_amount: bumpResourceValue(resourceBounds.l2_gas.max_amount),
          max_price_per_unit: bumpResourceValue(resourceBounds.l2_gas.max_price_per_unit),
        }
      : undefined,
    l1_data_gas: resourceBounds.l1_data_gas
      ? {
          max_amount: bumpResourceValue(resourceBounds.l1_data_gas.max_amount),
          max_price_per_unit: bumpResourceValue(resourceBounds.l1_data_gas.max_price_per_unit),
        }
      : undefined,
  };
}

async function executePocketPigCalls(account: AccountInterface, calls: Call[]) {
  const accountWithFees = account as AccountInterface & {
    estimateInvokeFee?: (
      calls: Call[],
      details?: Record<string, unknown>,
    ) => Promise<{
      resourceBounds?: {
        l1_gas?: { max_amount: bigint; max_price_per_unit: bigint };
        l2_gas?: { max_amount: bigint; max_price_per_unit: bigint };
        l1_data_gas?: { max_amount: bigint; max_price_per_unit: bigint };
      };
    }>;
    execute: (
      calls: Call[],
      details?: Record<string, unknown>,
    ) => Promise<{ transaction_hash?: string; transactionHash?: string }>;
  };

  let executionDetails: Record<string, unknown> | undefined;

  if (typeof accountWithFees.estimateInvokeFee === 'function') {
    try {
      const estimate = await accountWithFees.estimateInvokeFee(calls, {
        skipValidate: false,
      });
      const resourceBounds = bumpResourceBounds(estimate.resourceBounds);
      if (resourceBounds) {
        executionDetails = {
          resourceBounds,
          tip: 0n,
        };
      }
    } catch {
      executionDetails = undefined;
    }
  }

  return accountWithFees.execute(calls, executionDetails);
}

async function fetchAvnuTokenPriceUsd(tokenAddress: string) {
  try {
    const response = await fetch(`${AVNU_TOKEN_BASE_URL}/${tokenAddress}`);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      starknet?: { usd?: number | string | null };
      priceInUsd?: number | string | null;
    };
    const candidate = Number(
      payload?.starknet?.usd ?? payload?.priceInUsd ?? 0,
    );

    return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
  } catch {
    return null;
  }
}

interface AvnuTokenListItem {
  name?: string;
  symbol?: string;
  address: string;
  decimals?: number;
  verified?: boolean;
}

async function fetchAvnuVerifiedTokens(): Promise<Token[]> {
  try {
    const response = await fetch(AVNU_TOKEN_BASE_URL);
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as AvnuTokenListItem[];
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .filter((token) => token.verified && token.address && token.symbol && Number.isFinite(token.decimals))
      .map((token) => ({
        name: token.name ?? token.symbol ?? 'Token',
        symbol: token.symbol ?? 'TOKEN',
        address: token.address,
        decimals: Number(token.decimals ?? 18),
      }));
  } catch {
    return [];
  }
}

export async function getPocketPigAssetUsdPrice(mode: FeedMode) {
  if (mode === 'safe') {
    return 1;
  }

  if (mode === 'grow') {
    return await fetchAvnuTokenPriceUsd(getSourceToken().address);
  }

  if (mode === 'eth') {
    return await fetchAvnuTokenPriceUsd(getTokenCatalog().ETH.address);
  }

  const target = await resolveBitcoinPoolAndToken();
  return await fetchAvnuTokenPriceUsd(target.token.address);
}

function assertMinimumUsdValue(usdValue: number | null, symbol: string) {
  if (!usdValue || usdValue < MIN_OPERATION_USD) {
    throw new Error(`Increase the ${symbol} amount.`);
  }
}

function calculateFeeRaw(amountRaw: bigint, feeBps: number) {
  return (amountRaw * BigInt(feeBps)) / 10_000n;
}

function subtractFee(amountRaw: bigint, feeRaw: bigint) {
  const netAmount = amountRaw - feeRaw;
  if (netAmount <= 0n) {
    throw new Error('Net amount too small after fee. Increase the amount.');
  }

  return netAmount;
}

async function resolveDelegationPoolForToken(tokenAddress: string) {
  const token = getTokenByAddress(tokenAddress);

  if (!token) {
    throw new Error('The token to be staked was not found in the PocketPig catalog.');
  }

  for (const validator of DEFAULT_VALIDATOR_CANDIDATES) {
    try {
      const pools = await sdk.getStakerPools(validator.address as never);
      const matchingPool = pools.find(
        (pool) => pool.token.address.toLowerCase() === token.address.toLowerCase(),
      );
      if (matchingPool) {
        return {
          poolAddress: matchingPool.poolContract,
          token: matchingPool.token,
          validatorLabel: validator.label,
        };
      }
    } catch {
      continue;
    }
  }

  throw new Error(`No available staking pool was found for ${token.symbol}.`);
}

async function resolveDefaultStrkPool() {
  return resolveDelegationPoolForToken(getSourceToken().address);
}

async function resolveBitcoinPoolAndToken() {
  const preferredSymbols = ['WBTC', 'LBTC', 'TBTC', 'SOLVBTC'];
  for (const validator of BITCOIN_VALIDATOR_CANDIDATES) {
    try {
      const pools = await sdk.getStakerPools(validator.address as never);
      const bitcoinPools = pools.filter(
        (pool) =>
          pool.token.symbol !== 'STRK' &&
          pool.token.symbol.toUpperCase().includes('BTC'),
      );

      const preferred = preferredSymbols
        .map((symbol) => bitcoinPools.find((pool) => pool.token.symbol === symbol))
        .find(Boolean);

      if (preferred) {
        return {
          poolAddress: preferred.poolContract,
          token: preferred.token,
          validatorLabel: validator.label,
        };
      }

      const fallback = bitcoinPools[0];
      if (fallback) {
        return {
          poolAddress: fallback.poolContract,
          token: fallback.token,
          validatorLabel: validator.label,
        };
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    appEnv.starkzapNetwork === 'mainnet'
      ? 'No stakeable BTC pool was found under the Nansen validator.'
      : 'No stakeable BTC pool was found on this network.',
  );
}

function createPoolContract(poolAddress: string) {
  return new Contract({
    abi: POOL_ABI,
    address: poolAddress,
    providerOrAccount: sdk.getProvider(),
  }).typedv2(POOL_ABI);
}

function createTokenContract(tokenAddress: string) {
  return new Contract({
    abi: ERC20_ABI,
    address: tokenAddress,
    providerOrAccount: sdk.getProvider(),
  }).typedv2(ERC20_ABI);
}

async function readBalanceRaw(account: AccountInterface, token: Token) {
  const result = await sdk.callContract({
    contractAddress: token.address,
    entrypoint: 'balanceOf',
    calldata: [account.address],
  });

  return parseUint256(result);
}

async function readBalanceRawForAddress(accountAddress: string, tokenAddress: string) {
  const result = await sdk.callContract({
    contractAddress: tokenAddress,
    entrypoint: 'balanceOf',
    calldata: [accountAddress],
  });

  return parseUint256(result);
}

async function assertSufficientWalletBalance(params: {
  walletAddress?: string | null;
  token: Token;
  requiredRaw: bigint;
  label?: string;
}) {
  if (!params.walletAddress) {
    return;
  }

  const balanceRaw = await readBalanceRawForAddress(params.walletAddress, params.token.address);
  if (balanceRaw < params.requiredRaw) {
    const available = formatTokenAmount(balanceRaw, params.token.decimals, 6);
    if (
      appEnv.starkzapNetwork === 'mainnet' &&
      params.token.symbol === 'USDC' &&
      params.token.address.toLowerCase() ===
        '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8'
    ) {
      const bridgedUsdcAddress =
        '0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb';
      const bridgedRaw = await readBalanceRawForAddress(params.walletAddress, bridgedUsdcAddress).catch(
        () => 0n,
      );
      if (bridgedRaw > 0n) {
        const bridgedAvailable = formatTokenAmount(bridgedRaw, 6, 6);
        throw new Error(
          `Insufficient Vesu-compatible USDC balance. Available in Vesu market token: ${available} USDC. Wallet also holds ${bridgedAvailable} USDC on ${bridgedUsdcAddress}, but Vesu Genesis Pool uses the USDC market at 0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8.`,
        );
      }
    }
    throw new Error(
      `Insufficient ${params.label ?? params.token.symbol} balance. Available: ${available} ${params.token.symbol}.`,
    );
  }
}

async function readUint256Call(contractAddress: string, entrypoint: string, calldata: string[]) {
  const result = await sdk.callContract({
    contractAddress,
    entrypoint,
    calldata,
  });

  return parseUint256(result);
}

async function readAllowanceRawForAddress(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
) {
  return readUint256Call(tokenAddress, 'allowance', [ownerAddress, spenderAddress]);
}

async function buildNativeStakeCalls(params: {
  accountAddress: string;
  poolAddress: string;
  token: Token;
  amount: bigint;
}) {
  const tokenContract = createTokenContract(params.token.address);
  const poolContract = createPoolContract(params.poolAddress);

  const approveCall = tokenContract.populateTransaction.approve(
    params.poolAddress,
    params.amount,
  );
  const member = await poolContract.get_pool_member_info_v1(params.accountAddress);
  const stakeCall = member.isSome()
    ? poolContract.populateTransaction.add_to_delegation_pool(
        params.accountAddress,
        params.amount,
      )
    : poolContract.populateTransaction.enter_delegation_pool(
        params.accountAddress,
        params.amount,
      );

  return [approveCall, stakeCall] satisfies Call[];
}

async function readManagedPosition(params: {
  id: string;
  mode: Extract<FeedMode, 'grow' | 'bitcoin'>;
  accountAddress: string;
  poolAddress: string;
  token: Token;
  validatorLabel: string;
}) {
  const poolContract = createPoolContract(params.poolAddress);
  const member = await poolContract.get_pool_member_info_v1(params.accountAddress);

  if (member.isNone()) {
    return {
      id: params.id,
      mode: params.mode,
      validatorLabel: params.validatorLabel,
      poolAddress: params.poolAddress,
      tokenSymbol: params.token.symbol,
      tokenAddress: params.token.address,
      stakedRaw: 0n,
      stakedDisplay: '0',
      rewardsRaw: 0n,
      rewardsDisplay: '0',
      rewardsSymbol: 'STRK',
      unpoolingRaw: 0n,
      unpoolingDisplay: '0',
      unpoolTime: null,
      canClaim: false,
      canUnstake: false,
      canCompleteExit: false,
    } satisfies StakingPosition;
  }

  const info = member.unwrap()!;
  const stakedRaw = BigInt(info.amount);
  const rewardsRaw = BigInt(info.unclaimed_rewards);
  const unpoolingRaw = BigInt(info.unpool_amount);
  const rewardsToken = getSourceToken();
  const unpoolTimeSeconds = info.unpool_time.isSome()
    ? Number(info.unpool_time.unwrap()!.seconds)
    : null;
  const canCompleteExit =
    unpoolTimeSeconds !== null && Date.now() >= unpoolTimeSeconds * 1000;

  return {
    id: params.id,
    mode: params.mode,
    validatorLabel: params.validatorLabel,
    poolAddress: params.poolAddress,
    tokenSymbol: params.token.symbol,
    tokenAddress: params.token.address,
    stakedRaw,
    stakedDisplay: formatTokenAmount(stakedRaw, params.token.decimals),
    rewardsRaw,
    rewardsDisplay: formatTokenAmount(rewardsRaw, rewardsToken.decimals),
    rewardsSymbol: rewardsToken.symbol,
    unpoolingRaw,
    unpoolingDisplay: formatTokenAmount(unpoolingRaw, params.token.decimals),
    unpoolTime: unpoolTimeSeconds ? new Date(unpoolTimeSeconds * 1000).toISOString() : null,
    canClaim: rewardsRaw > 0n,
    canUnstake: stakedRaw > 0n || canCompleteExit,
    canCompleteExit,
  } satisfies StakingPosition;
}

export function getPocketPigSourceToken() {
  return getSourceToken();
}

export function getPocketPigTargetToken(mode: FeedMode) {
  if (mode === 'grow') {
    return getSourceToken();
  }

  if (mode === 'eth') {
    return getTokenCatalog().ETH;
  }

  return getTargetToken(mode);
}

export async function getPocketPigBalances(account: AccountInterface) {
  const tokens = getTokenCatalog();
  const trackedTokens = [
    tokens.STRK,
    tokens.ETH,
    getNativeUsdcToken(),
    tokens.WBTC ?? tokens.TBTC ?? tokens.LBTC,
  ];

  const balances = await Promise.all(
    trackedTokens.map(async (token) => {
      const rawAmount = await readBalanceRaw(account, token);
      const displayAmount = formatTokenAmount(rawAmount, token.decimals);
      return {
        symbol: token.symbol,
        address: token.address,
        decimals: token.decimals,
        rawAmount,
        formattedAmount: Number(displayAmount),
        displayAmount,
      } satisfies PocketPigBalance;
    }),
  );

  return balances;
}

export async function discoverWalletTokenBalances(walletAddress: string) {
  const trackedByAddress = new Map<string, Token>();
  for (const token of [
    getTokenCatalog().STRK,
    getTokenCatalog().ETH,
    getNativeUsdcToken(),
    getTokenCatalog().WBTC ?? getTokenCatalog().TBTC ?? getTokenCatalog().LBTC,
  ]) {
    trackedByAddress.set(token.address.toLowerCase(), token);
  }

  const verifiedTokens = await fetchAvnuVerifiedTokens();
  for (const token of verifiedTokens) {
    trackedByAddress.set(token.address.toLowerCase(), token);
  }

  const balances = await Promise.all(
    Array.from(trackedByAddress.values()).map(async (token) => {
      const rawAmount = await readBalanceRawForAddress(walletAddress, token.address).catch(() => 0n);
      return {
        token,
        rawAmount,
      };
    }),
  );

  return balances
    .filter(({ rawAmount }) => rawAmount > 0n)
    .sort((left, right) => {
      if (left.token.symbol === 'STRK') return -1;
      if (right.token.symbol === 'STRK') return 1;
      return left.token.symbol.localeCompare(right.token.symbol);
    })
    .map(({ token, rawAmount }) => {
      const displayAmount = formatTokenAmount(rawAmount, token.decimals, token.symbol === 'WBTC' ? 8 : 6);
      return {
        symbol: token.symbol,
        address: token.address,
        decimals: token.decimals,
        rawAmount,
        formattedAmount: Number(displayAmount),
        displayAmount,
      } satisfies PocketPigBalance;
    });
}

export async function getPocketPigFeedPreview(params: {
  walletAddress?: string | null;
  mode: FeedMode;
  growAmount: number;
  targetUsdAmount: number;
  ethAmount: number;
  bitcoinAmount: number;
}) {
  const sourceToken = getSourceToken();

  if (params.mode === 'grow') {
    const sourceAmountRaw = amountToRaw(params.growAmount, sourceToken.decimals);
    const priceUsd = await fetchAvnuTokenPriceUsd(sourceToken.address);
    const usdValue = priceUsd ? params.growAmount * priceUsd : null;
    const feeBps = FEE_BPS.grow;
    const feeRaw = calculateFeeRaw(sourceAmountRaw, feeBps);
    const netAmountRaw = subtractFee(sourceAmountRaw, feeRaw);
    assertMinimumUsdValue(usdValue, sourceToken.symbol);
    return {
      sourceSymbol: sourceToken.symbol,
      sourceAmount: params.growAmount,
      sourceAmountDisplay: formatTokenAmount(sourceAmountRaw, sourceToken.decimals),
      targetSymbol: sourceToken.symbol,
      targetAmountDisplay: formatTokenAmount(netAmountRaw, sourceToken.decimals),
      usdValue,
      targetAmountUsd: usdValue ? (Number(netAmountRaw) / Number(sourceAmountRaw)) * usdValue : null,
      feeBps,
      feeAmountDisplay: formatTokenAmount(feeRaw, sourceToken.decimals),
      feeAmountUsd: usdValue ? (Number(feeRaw) / Number(sourceAmountRaw)) * usdValue : null,
      controlLabel: `${params.growAmount} STRK`,
      helperText: `Stake ${params.growAmount} STRK directly in the validator pool.`,
    } satisfies FeedPreview;
  }

  if (params.mode === 'bitcoin') {
    const target = await resolveBitcoinPoolAndToken();
    const bitcoinRaw = amountToRaw(params.bitcoinAmount, target.token.decimals);
    const priceUsd = await fetchAvnuTokenPriceUsd(target.token.address);
    const usdValue = priceUsd ? params.bitcoinAmount * priceUsd : null;
    const feeBps = FEE_BPS.bitcoin;
    const feeRaw = calculateFeeRaw(bitcoinRaw, feeBps);
    const netAmountRaw = subtractFee(bitcoinRaw, feeRaw);

    if (bitcoinRaw <= 0n) {
      throw new Error('BTC stake amount must be greater than zero.');
    }

    assertMinimumUsdValue(usdValue, target.token.symbol);

    return {
      sourceSymbol: target.token.symbol,
      sourceAmount: params.bitcoinAmount,
      sourceAmountDisplay: formatTokenAmount(bitcoinRaw, target.token.decimals, 8),
      targetSymbol: target.token.symbol,
      targetAmountDisplay: formatTokenAmount(netAmountRaw, target.token.decimals, 8),
      usdValue,
      targetAmountUsd: usdValue ? (Number(netAmountRaw) / Number(bitcoinRaw)) * usdValue : null,
      feeBps,
      feeAmountDisplay: formatTokenAmount(feeRaw, target.token.decimals, 8),
      feeAmountUsd: usdValue ? (Number(feeRaw) / Number(bitcoinRaw)) * usdValue : null,
      controlLabel: `${params.bitcoinAmount} ${target.token.symbol}`,
      helperText: `Stake ${formatTokenAmount(bitcoinRaw, target.token.decimals, 8)} ${target.token.symbol} directly with ${target.validatorLabel}.`,
    } satisfies FeedPreview;
  }

  if (params.mode === 'safe') {
    const usdToken = getUsdToken();
    const suppliedRaw = amountToRaw(params.targetUsdAmount, usdToken.decimals);
    const feeBps = FEE_BPS.safe;
    const feeRaw = calculateFeeRaw(suppliedRaw, feeBps);
    const netAmountRaw = subtractFee(suppliedRaw, feeRaw);

    if (suppliedRaw <= 0n) {
      throw new Error('USDC supply amount must be greater than zero.');
    }
    await assertSufficientWalletBalance({
      walletAddress: params.walletAddress,
      token: usdToken,
      requiredRaw: suppliedRaw,
      label: 'Vesu-compatible USDC',
    });
    assertMinimumUsdValue(params.targetUsdAmount, usdToken.symbol);

    return {
      sourceSymbol: usdToken.symbol,
      sourceAmount: params.targetUsdAmount,
      sourceAmountDisplay: formatTokenAmount(suppliedRaw, usdToken.decimals, 6),
      targetSymbol: usdToken.symbol,
      targetAmountDisplay: formatTokenAmount(netAmountRaw, usdToken.decimals, 6),
      usdValue: params.targetUsdAmount,
      targetAmountUsd: rawToNumber(netAmountRaw, usdToken.decimals, 6),
      feeBps,
      feeAmountDisplay: formatTokenAmount(feeRaw, usdToken.decimals, 6),
      feeAmountUsd: rawToNumber(feeRaw, usdToken.decimals, 6),
      controlLabel: `${params.targetUsdAmount.toFixed(2)} ${usdToken.symbol}`,
      helperText: `Supply ${formatTokenAmount(suppliedRaw, usdToken.decimals, 6)} ${usdToken.symbol} directly into ${VESU_SUPPLY_CONFIG.protocolLabel} ${VESU_SUPPLY_CONFIG.poolLabel}.`,
    } satisfies FeedPreview;
  }

  if (params.mode === 'eth') {
    const ethToken = getTokenCatalog().ETH;
    const suppliedRaw = amountToRaw(params.ethAmount, ethToken.decimals);
    const priceUsd = await fetchAvnuTokenPriceUsd(ethToken.address);
    const usdValue = priceUsd ? params.ethAmount * priceUsd : null;
    const feeBps = FEE_BPS.eth;
    const feeRaw = calculateFeeRaw(suppliedRaw, feeBps);
    const netAmountRaw = subtractFee(suppliedRaw, feeRaw);

    if (suppliedRaw <= 0n) {
      throw new Error('ETH supply amount must be greater than zero.');
    }
    await assertSufficientWalletBalance({
      walletAddress: params.walletAddress,
      token: ethToken,
      requiredRaw: suppliedRaw,
    });

    assertMinimumUsdValue(usdValue, ethToken.symbol);

    return {
      sourceSymbol: ethToken.symbol,
      sourceAmount: params.growAmount,
      sourceAmountDisplay: formatTokenAmount(suppliedRaw, ethToken.decimals, 6),
      targetSymbol: ethToken.symbol,
      targetAmountDisplay: formatTokenAmount(netAmountRaw, ethToken.decimals, 6),
      usdValue,
      targetAmountUsd: usdValue ? (Number(netAmountRaw) / Number(suppliedRaw)) * usdValue : null,
      feeBps,
      feeAmountDisplay: formatTokenAmount(feeRaw, ethToken.decimals, 6),
      feeAmountUsd: usdValue ? (Number(feeRaw) / Number(suppliedRaw)) * usdValue : null,
      controlLabel: `${params.ethAmount} ${ethToken.symbol}`,
      helperText: `Supply ${formatTokenAmount(suppliedRaw, ethToken.decimals, 6)} ${ethToken.symbol} directly into ${VESU_SUPPLY_CONFIG.protocolLabel} ${VESU_SUPPLY_CONFIG.poolLabel}.`,
    } satisfies FeedPreview;
  }

  throw new Error('Unsupported feed mode.');

}

export async function executePocketPigFeed(params: {
  account: AccountInterface;
  mode: FeedMode;
  growAmount: number;
  targetUsdAmount: number;
  ethAmount: number;
  bitcoinAmount: number;
}) {
  const { account, mode } = params;
  let sourceToken: Token;
  let calls: Call[];
  let explorerLabel: string;
  let assetSymbol: string;
  let targetSymbol: string;
  let sourceAmountRaw: bigint;
  let targetAmountDisplay: string;
  let usdValue: number | null = null;
  let priceUsd: number | null = null;
  let feeBps: number;
  let feeAmountRaw: bigint;
  let feeAmountDisplay: string;
  let feeAmountUsd: number | null = null;
  let targetAmountUsd: number | null = null;
  if (mode === 'grow') {
    sourceToken = getSourceToken();
    sourceAmountRaw = amountToRaw(params.growAmount, sourceToken.decimals);

    if (sourceAmountRaw <= 0n) {
      throw new Error('Stake amount must be greater than zero.');
    }

    const pool = await resolveDefaultStrkPool();
    feeBps = FEE_BPS.grow;
    feeAmountRaw = calculateFeeRaw(sourceAmountRaw, feeBps);
    const netAmountRaw = subtractFee(sourceAmountRaw, feeAmountRaw);
    const stakeCalls = await buildNativeStakeCalls({
      accountAddress: account.address,
      poolAddress: pool.poolAddress,
      token: pool.token,
      amount: netAmountRaw,
    });
    calls = stakeCalls;
    explorerLabel = `Stake ${params.growAmount} ${sourceToken.symbol}`;
    assetSymbol = sourceToken.symbol;
    targetSymbol = sourceToken.symbol;
    targetAmountDisplay = formatTokenAmount(netAmountRaw, sourceToken.decimals);
    priceUsd = await fetchAvnuTokenPriceUsd(sourceToken.address);
    usdValue = priceUsd ? rawToNumber(sourceAmountRaw, sourceToken.decimals) * priceUsd : null;
    assertMinimumUsdValue(usdValue, sourceToken.symbol);
    feeAmountDisplay = formatTokenAmount(feeAmountRaw, sourceToken.decimals);
    feeAmountUsd = usdValue ? (Number(feeAmountRaw) / Number(sourceAmountRaw)) * usdValue : null;
    targetAmountUsd = usdValue ? (Number(netAmountRaw) / Number(sourceAmountRaw)) * usdValue : null;
  } else if (mode === 'bitcoin') {
    const target = await resolveBitcoinPoolAndToken();
    sourceToken = target.token;
    sourceAmountRaw = amountToRaw(params.bitcoinAmount, target.token.decimals);

    if (sourceAmountRaw <= 0n) {
      throw new Error('BTC stake amount must be greater than zero.');
    }

    feeBps = FEE_BPS.bitcoin;
    feeAmountRaw = calculateFeeRaw(sourceAmountRaw, feeBps);
    const netAmountRaw = subtractFee(sourceAmountRaw, feeAmountRaw);
    const stakeCalls = await buildNativeStakeCalls({
      accountAddress: account.address,
      poolAddress: target.poolAddress,
      token: target.token,
      amount: netAmountRaw,
    });
    calls = stakeCalls;
    explorerLabel = `Stake ${params.bitcoinAmount} ${target.token.symbol} with ${target.validatorLabel}`;
    assetSymbol = target.token.symbol;
    targetSymbol = target.token.symbol;
    targetAmountDisplay = formatTokenAmount(netAmountRaw, target.token.decimals, 8);
    priceUsd = await fetchAvnuTokenPriceUsd(target.token.address);
    usdValue = priceUsd ? rawToNumber(sourceAmountRaw, target.token.decimals, 8) * priceUsd : null;
    assertMinimumUsdValue(usdValue, target.token.symbol);
    feeAmountDisplay = formatTokenAmount(feeAmountRaw, target.token.decimals, 8);
    feeAmountUsd = usdValue ? (Number(feeAmountRaw) / Number(sourceAmountRaw)) * usdValue : null;
    targetAmountUsd = usdValue ? (Number(netAmountRaw) / Number(sourceAmountRaw)) * usdValue : null;
  } else {
    const supplyMode = mode === 'eth' ? 'eth' : 'safe';
    const supplyConfig = VESU_SUPPLY_CONFIG[supplyMode];
    const target = supplyConfig.token();
    sourceToken = target;
    const inputAmount =
      supplyMode === 'safe' ? params.targetUsdAmount : params.ethAmount;
    sourceAmountRaw = amountToRaw(inputAmount, target.decimals);
    if (sourceAmountRaw <= 0n) {
      throw new Error(
        supplyMode === 'safe'
          ? 'USDC supply amount must be greater than zero.'
          : 'ETH supply amount must be greater than zero.',
      );
    }
    await assertSufficientWalletBalance({
      walletAddress: account.address,
      token: target,
      requiredRaw: sourceAmountRaw,
      label: supplyMode === 'safe' ? 'Vesu-compatible USDC' : undefined,
    });

    const tokenContract = createTokenContract(target.address);
    feeBps = FEE_BPS[supplyMode];
    feeAmountRaw = calculateFeeRaw(sourceAmountRaw, feeBps);
    const netAmountRaw = subtractFee(sourceAmountRaw, feeAmountRaw);
    const allowanceRaw = await readAllowanceRawForAddress(
      target.address,
      account.address,
      supplyConfig.vTokenAddress,
    ).catch(() => 0n);

    if (allowanceRaw < netAmountRaw) {
      const approveResult = (await executePocketPigCalls(account, [
        tokenContract.populateTransaction.approve(supplyConfig.vTokenAddress, netAmountRaw),
      ])) as {
        transaction_hash?: string;
        transactionHash?: string;
      };
      const approvalHash = approveResult.transaction_hash ?? approveResult.transactionHash;
      if (!approvalHash) {
        throw new Error('Approval transaction hash could not be read.');
      }
      await sdk.getProvider().waitForTransaction(approvalHash);
    }

    calls = [
      {
        contractAddress: supplyConfig.vTokenAddress,
        entrypoint: 'deposit',
        calldata: [...toUint256Calldata(netAmountRaw), account.address],
      },
    ];
    explorerLabel = `Supply ${inputAmount.toFixed(supplyMode === 'safe' ? 2 : 6)} ${target.symbol} on ${VESU_SUPPLY_CONFIG.protocolLabel}`;
    targetAmountDisplay = formatTokenAmount(netAmountRaw, target.decimals, 6);
    assetSymbol = target.symbol;
    targetSymbol = target.symbol;
    priceUsd =
      supplyMode === 'safe' ? 1 : await fetchAvnuTokenPriceUsd(target.address);
    usdValue =
      supplyMode === 'safe'
        ? inputAmount
        : priceUsd
          ? rawToNumber(sourceAmountRaw, target.decimals, 6) * priceUsd
          : null;
    assertMinimumUsdValue(usdValue, target.symbol);
    feeAmountDisplay = formatTokenAmount(feeAmountRaw, target.decimals, 6);
    feeAmountUsd =
      supplyMode === 'safe'
        ? rawToNumber(feeAmountRaw, target.decimals, 6)
        : usdValue
          ? (Number(feeAmountRaw) / Number(sourceAmountRaw)) * usdValue
          : null;
    targetAmountUsd =
      supplyMode === 'safe'
        ? rawToNumber(netAmountRaw, target.decimals, 6)
        : usdValue
          ? (Number(netAmountRaw) / Number(sourceAmountRaw)) * usdValue
          : null;
  }

  const result = (await executePocketPigCalls(account, calls)) as {
    transaction_hash?: string;
    transactionHash?: string;
  };
  const transactionHash = result.transaction_hash ?? result.transactionHash;

  if (!transactionHash) {
    throw new Error('Transaction hash could not be read.');
  }

  await sdk.getProvider().waitForTransaction(transactionHash);

  return {
    transactionHash,
    assetSymbol,
    targetSymbol,
    explorerLabel,
    sourceAmount: rawToNumber(sourceAmountRaw, sourceToken.decimals),
    sourceAmountDisplay: formatTokenAmount(sourceAmountRaw, sourceToken.decimals),
    targetAmountDisplay,
    usdValue,
    priceUsd,
    feeBps,
    feeAmountDisplay,
    feeAmountUsd,
    targetAmountUsd,
  } satisfies FeedExecutionResult;
}

export async function getPocketPigStakingPositions(account: AccountInterface) {
  const [growPool, bitcoinPool] = await Promise.all([
    resolveDefaultStrkPool(),
    resolveBitcoinPoolAndToken().catch(() => null),
  ]);

  const positions = await Promise.all([
    readManagedPosition({
      id: 'grow',
      mode: 'grow',
      accountAddress: account.address,
      poolAddress: growPool.poolAddress,
      token: growPool.token,
      validatorLabel: growPool.validatorLabel,
    }),
    bitcoinPool
      ? readManagedPosition({
          id: 'bitcoin',
          mode: 'bitcoin',
          accountAddress: account.address,
          poolAddress: bitcoinPool.poolAddress,
          token: bitcoinPool.token,
          validatorLabel: bitcoinPool.validatorLabel,
        })
      : null,
  ]);

  return positions.filter(Boolean) as StakingPosition[];
}

export async function getPocketPigSupplyPosition(
  account: AccountInterface,
  mode: Extract<FeedMode, 'safe' | 'eth'>,
) {
  const config = VESU_SUPPLY_CONFIG[mode];
  const token = config.token();
  const sharesRaw = await readBalanceRawForAddress(
    account.address,
    config.vTokenAddress,
  );
  const suppliedRaw =
    sharesRaw > 0n
      ? await readUint256Call(
          config.vTokenAddress,
          'convert_to_assets',
          toUint256Calldata(sharesRaw),
        )
      : 0n;
  const maxWithdrawRaw = await readUint256Call(
    config.vTokenAddress,
    'max_withdraw',
    [account.address],
  );

  return {
    id: mode,
    mode,
    protocolLabel: VESU_SUPPLY_CONFIG.protocolLabel,
    poolLabel: VESU_SUPPLY_CONFIG.poolLabel,
    assetSymbol: token.symbol,
    assetAddress: token.address,
    vTokenAddress: config.vTokenAddress,
    suppliedRaw,
    suppliedDisplay: formatTokenAmount(suppliedRaw, token.decimals, 6),
    sharesRaw,
    sharesDisplay: formatTokenAmount(sharesRaw, token.decimals, 6),
    maxWithdrawRaw,
    maxWithdrawDisplay: formatTokenAmount(maxWithdrawRaw, token.decimals, 6),
    canWithdraw: maxWithdrawRaw > 0n,
  } satisfies SupplyPosition;
}

export async function getPocketPigSafePosition(account: AccountInterface) {
  return getPocketPigSupplyPosition(account, 'safe');
}

export async function getPocketPigEthPosition(account: AccountInterface) {
  return getPocketPigSupplyPosition(account, 'eth');
}

export async function claimPocketPigStakeRewards(params: {
  account: AccountInterface;
  position: StakingPosition;
}) {
  const poolContract = createPoolContract(params.position.poolAddress);
  const call = poolContract.populateTransaction.claim_rewards(params.account.address);
  const result = (await executePocketPigCalls(params.account, [call])) as {
    transaction_hash?: string;
    transactionHash?: string;
  };
  const transactionHash = result.transaction_hash ?? result.transactionHash;
  if (!transactionHash) {
    throw new Error('Claim transaction hash could not be read.');
  }
  await sdk.getProvider().waitForTransaction(transactionHash);
  return transactionHash;
}

export async function unstakePocketPigPosition(params: {
  account: AccountInterface;
  position: StakingPosition;
}) {
  const poolContract = createPoolContract(params.position.poolAddress);
  let call: Call;

  if (params.position.canCompleteExit) {
    call = poolContract.populateTransaction.exit_delegation_pool_action(
      params.account.address,
    );
  } else if (params.position.stakedRaw > 0n) {
    call = poolContract.populateTransaction.exit_delegation_pool_intent(
      params.position.stakedRaw,
    );
  } else {
    throw new Error('No active position was found to unstake.');
  }

  const result = (await executePocketPigCalls(params.account, [call])) as {
    transaction_hash?: string;
    transactionHash?: string;
  };
  const transactionHash = result.transaction_hash ?? result.transactionHash;
  if (!transactionHash) {
    throw new Error('Unstake transaction hash could not be read.');
  }
  await sdk.getProvider().waitForTransaction(transactionHash);
  return transactionHash;
}

export async function withdrawPocketPigSafePosition(params: {
  account: AccountInterface;
  position: SupplyPosition;
}) {
  if (params.position.maxWithdrawRaw <= 0n) {
    throw new Error('No USDC is available to withdraw.');
  }

  const result = (await executePocketPigCalls(params.account, [
    {
      contractAddress: params.position.vTokenAddress,
      entrypoint: 'withdraw',
      calldata: [
        ...toUint256Calldata(params.position.maxWithdrawRaw),
        params.account.address,
        params.account.address,
      ],
    },
  ])) as {
    transaction_hash?: string;
    transactionHash?: string;
  };
  const transactionHash = result.transaction_hash ?? result.transactionHash;
  if (!transactionHash) {
    throw new Error('Withdraw transaction hash could not be read.');
  }
  await sdk.getProvider().waitForTransaction(transactionHash);
  return transactionHash;
}

export async function transferPocketPigAsset(params: {
  account: AccountInterface;
  tokenAddress: string;
  tokenDecimals: number;
  recipient: string;
  amount: number;
}) {
  let recipientAddress: string;
  try {
    recipientAddress = validateAndParseAddress(params.recipient);
  } catch {
    throw new Error('Recipient address is invalid.');
  }

  if (recipientAddress.toLowerCase() === params.account.address.toLowerCase()) {
    throw new Error('Recipient address must be different from the connected wallet.');
  }

  const rawAmount = amountToRaw(params.amount, params.tokenDecimals);
  if (rawAmount <= 0n) {
    throw new Error('Transfer amount must be greater than zero.');
  }

  const token = getTokenByAddress(params.tokenAddress);
  if (token) {
    await assertSufficientWalletBalance({
      walletAddress: params.account.address,
      token,
      requiredRaw: rawAmount,
    });
  }

  const tokenContract = createTokenContract(params.tokenAddress);
  const result = (await executePocketPigCalls(params.account, [
    tokenContract.populateTransaction.transfer(recipientAddress, rawAmount),
  ])) as {
    transaction_hash?: string;
    transactionHash?: string;
  };
  const transactionHash = result.transaction_hash ?? result.transactionHash;
  if (!transactionHash) {
    throw new Error('Transfer transaction hash could not be read.');
  }
  await sdk.getProvider().waitForTransaction(transactionHash);
  return transactionHash;
}

export async function getDefaultGrowPool() {
  const pool = await resolveDefaultStrkPool();
  return {
    poolAddress: pool.poolAddress,
    token: pool.token,
  };
}
