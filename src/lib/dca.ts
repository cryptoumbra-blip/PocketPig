import { executeCancelDca, executeCreateDca, type AvnuOptions } from '@avnu/avnu-sdk';
import moment from 'moment';
import { parseUnits, toBeHex } from 'ethers';
import { mainnetTokens } from '../vendor/starkzap/tokens-mainnet';
import { sepoliaTokens } from '../vendor/starkzap/tokens-sepolia';
import type { AccountInterface } from 'starknet';
import { appEnv } from './env';
import { fetchDcaOrders, type DcaOrder } from './backend';

export type DcaAsset = 'bitcoin' | 'grow' | 'eth';
export type DcaCadence = 'daily' | 'weekly';

const DCA_ITERATIONS: Record<DcaCadence, number> = {
  daily: 30,
  weekly: 12,
};

const assetLabels: Record<DcaAsset, string> = {
  bitcoin: 'BTC',
  grow: 'STRK',
  eth: 'ETH',
};

function getTokenCatalog() {
  return appEnv.starkzapNetwork === 'mainnet' ? mainnetTokens : sepoliaTokens;
}

function getBuyTokenAddress(asset: DcaAsset) {
  const tokens = getTokenCatalog();
  if (asset === 'grow') {
    return tokens.STRK.address;
  }
  if (asset === 'eth') {
    return tokens.ETH.address;
  }

  return (tokens.WBTC ?? tokens.TBTC ?? tokens.LBTC).address;
}

function getSellTokenAddress() {
  return appEnv.starkzapNetwork === 'mainnet'
    ? '0x033068F6539f8e6e6b131e6B2B814e6c34A5224bC66947c47DaB9dFeE93b35fb'
    : getTokenCatalog().USDC.address;
}

function amountToRawString(amount: number, decimals: number) {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return toBeHex(parseUnits(safeAmount.toString(), decimals));
}

function getAvnuOptions(): AvnuOptions {
  return {
    baseUrl:
      appEnv.starkzapNetwork === 'mainnet'
        ? 'https://starknet.api.avnu.fi'
        : 'https://sepolia.api.avnu.fi',
  };
}

export function getDcaAssetLabel(asset: DcaAsset) {
  return assetLabels[asset];
}

export function getDcaIterations(cadence: DcaCadence) {
  return DCA_ITERATIONS[cadence];
}

export async function listPocketPigDcaOrders(walletAddress: string) {
  const response = await fetchDcaOrders({
    traderAddress: walletAddress,
    status: 'ACTIVE',
    page: 0,
    size: 20,
  });

  return response.content;
}

export async function createPocketPigDca(params: {
  account: AccountInterface;
  traderAddress: string;
  asset: DcaAsset;
  cadence: DcaCadence;
  usdcPerCycle: number;
}) {
  const iterations = DCA_ITERATIONS[params.cadence];
  const sellAmountPerCycle = amountToRawString(params.usdcPerCycle, 6);
  const sellAmount = amountToRawString(params.usdcPerCycle * iterations, 6);
  const result = await executeCreateDca(
    {
      provider: params.account as never,
      order: {
        sellTokenAddress: getSellTokenAddress(),
        buyTokenAddress: getBuyTokenAddress(params.asset),
        sellAmount,
        sellAmountPerCycle,
        frequency: moment.duration(1, params.cadence === 'daily' ? 'day' : 'week'),
        pricingStrategy: {},
        traderAddress: params.traderAddress,
      },
    },
    getAvnuOptions(),
  );
  const transactionHash = result.transactionHash;

  return {
    transactionHash,
    iterations,
    buyAssetLabel: getDcaAssetLabel(params.asset),
  };
}

export async function cancelPocketPigDca(params: {
  account: AccountInterface;
  orderAddress: string;
}) {
  const result = await executeCancelDca(
    {
      provider: params.account as never,
      orderAddress: params.orderAddress,
    },
    getAvnuOptions(),
  );
  return result.transactionHash;
}

export function formatDcaOrderAmount(
  rawAmount: string,
  decimals: number,
  precision = 4,
) {
  const value = BigInt(rawAmount);
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionString = fraction
    .toString()
    .padStart(decimals, '0')
    .slice(0, precision)
    .replace(/0+$/, '');

  return fractionString ? `${whole.toString()}.${fractionString}` : whole.toString();
}

export function resolveDcaOrderLabel(order: DcaOrder) {
  const tokens = getTokenCatalog();
  const buyToken = Object.values(tokens).find(
    (token) => token.address.toLowerCase() === order.buyTokenAddress.toLowerCase(),
  );

  return buyToken?.symbol ?? 'Token';
}
