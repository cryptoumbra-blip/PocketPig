import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { PrivyClient, verifyAccessToken } from '@privy-io/node';
import { Account, Contract, RpcProvider, typedData } from 'starknet';
import { ABI as ERC20_ABI } from '../node_modules/starkzap/dist/src/abi/erc20.js';
import { ABI as POOL_ABI } from '../node_modules/starkzap/dist/src/abi/pool.js';
import { ABI as STAKING_ABI } from '../node_modules/starkzap/dist/src/abi/staking.js';

const port = Number.parseInt(process.env.PORT ?? '8787', 10);
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';
const network = process.env.VITE_STARKZAP_NETWORK === 'sepolia' ? 'sepolia' : 'mainnet';
const rpcUrl =
  process.env.VITE_STARKNET_RPC_URL?.trim() ||
  (network === 'sepolia'
    ? 'https://rpc.starknet-sepolia.lava.build'
    : 'https://rpc.starknet.lava.build');
const avnuBaseUrl =
  network === 'sepolia' ? 'https://sepolia.api.avnu.fi' : 'https://starknet.api.avnu.fi';
const avnuPaymasterNodeUrl =
  process.env.VITE_AVNU_PAYMASTER_NODE_URL?.trim() ||
  (network === 'sepolia'
    ? 'https://sepolia.paymaster.avnu.fi'
    : 'https://starknet.paymaster.avnu.fi');
const avnuApiKey =
  process.env.AVNU_API_KEY ??
  process.env.VITE_AVNU_API_KEY ??
  process.env.VITE_AVNU_PAYMASTER_API_KEY ??
  '';
const provider = new RpcProvider({ nodeUrl: rpcUrl });

const privyAppId = process.env.PRIVY_APP_ID ?? process.env.VITE_PRIVY_APP_ID ?? '';
const privyAppSecret = process.env.PRIVY_APP_SECRET ?? '';
const privyVerificationKey =
  process.env.PRIVY_VERIFICATION_KEY?.replace(/\\n/g, '\n') ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const SECONDS_PER_YEAR = 31_536_000;
const SCALE = 10n ** 18n;
const BTC_SCALE = 10n ** 8n;
const STRK_STAKING_SHARE = 0.75;
const BTC_STAKING_SHARE = 0.25;
const MAX_ANNUAL_INFLATION = 0.04;
const REFERENCE_APRS = {
  grow: 8.54,
  bitcoin: 3.01,
};
const DCA_FREQUENCY = {
  daily: 'P1D',
  weekly: 'P1W',
};
const DCA_ITERATIONS = {
  daily: 30,
  weekly: 12,
};
const STAKING_CONTRACTS = {
  mainnet: '0x00ca1702e64c81d9a07b86bd2c540188d92a2c73cf5cc0e508d949015e7e84a7',
  sepolia: '0x03745ab04a431fc02871a139be6b93d9260b0ff3e779ad9c8b377183b23109f1',
};
const TOKEN_CATALOG = {
  mainnet: {
    USDC: {
      address: '0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb',
      symbol: 'USDC',
      decimals: 6,
    },
    ETH: {
      address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      symbol: 'ETH',
      decimals: 18,
    },
    WBTC: {
      address: '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac',
      symbol: 'WBTC',
      decimals: 8,
    },
    STRK: {
      address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      symbol: 'STRK',
      decimals: 18,
    },
  },
  sepolia: {
    USDC: {
      address: '0x0512feac6339ff7889822cb5aa2a86c848e9d392bb0e3e237c008674feed8343',
      symbol: 'USDC',
      decimals: 6,
    },
    ETH: {
      address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      symbol: 'ETH',
      decimals: 18,
    },
    STRK: {
      address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      symbol: 'STRK',
      decimals: 18,
    },
  },
};
const VESU_SAFE_CONFIG =
  network === 'sepolia'
    ? {
        singletonAddress:
          '0x02545b2e5d519fc230e9cd781046d3a64e092114f07e44771e0d719d148725ef',
        poolId:
          '0x4dc4f0ca6ea4961e4c8373265bfd5317678f4fe374d76f3fd7135f57763bf28',
        usdcAddress: TOKEN_CATALOG.sepolia.USDC.address,
      }
    : {
        singletonAddress:
          '0x02545b2e5d519fc230e9cd781046d3a64e092114f07e44771e0d719d148725ef',
        poolId:
          '0x4dc4f0ca6ea4961e4c8373265bfd5317678f4fe374d76f3fd7135f57763bf28',
        usdcAddress: TOKEN_CATALOG.mainnet.USDC.address,
      };

const marketCache = {
  expiresAt: 0,
  value: null,
};
let autoPigWorkerRunning = false;

if (!privyAppId || !privyAppSecret || !privyVerificationKey) {
  console.error(
    '[pocketpig-server] Missing PRIVY_APP_ID / PRIVY_APP_SECRET / PRIVY_VERIFICATION_KEY',
  );
}

const privyClient =
  privyAppId && privyAppSecret
    ? new PrivyClient({
        appId: privyAppId,
        appSecret: privyAppSecret,
        jwtVerificationKey: privyVerificationKey || undefined,
      })
    : null;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function sendJson(res, statusCode, payload) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, error, details) {
  sendJson(res, statusCode, {
    error,
    ...(details ? { details } : {}),
  });
}

async function readUpstreamError(response) {
  const fallback = `${response.status} ${response.statusText}`;

  try {
    const payload = await response.json();
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.messages) && payload.messages.length) {
        return payload.messages[0];
      }

      if ('error' in payload && typeof payload.error === 'string') {
        return payload.error;
      }

      if ('message' in payload && typeof payload.message === 'string') {
        return payload.message;
      }
    }
  } catch {
    // fall through
  }

  return fallback;
}

async function fetchPaymasterStatus() {
  if (!avnuApiKey) {
    return { configured: false };
  }

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endpoint = new URL('/paymaster/v1/sponsor-activity', avnuBaseUrl);
    endpoint.searchParams.set('startDate', weekAgo.toISOString());
    endpoint.searchParams.set('endDate', now.toISOString());

    const response = await fetch(endpoint, {
      headers: {
        'api-key': avnuApiKey,
      },
    });

    if (!response.ok) {
      return {
        configured: true,
        ok: false,
        error: await readUpstreamError(response),
      };
    }

    const payload = await response.json();
    return {
      configured: true,
      ok: true,
      payload,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown paymaster error',
    };
  }
}

function getBearerToken(req) {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

function isHexHash(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value);
}

async function checkDeployedAddress(address) {
  try {
    const classHash = await provider.getClassHashAt(address);
    return Boolean(classHash);
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('contract not found') || message.includes('contract_not_found')) {
        return false;
      }
    }

    throw error;
  }
}

async function safeCheckDeployedAddress(address) {
  try {
    return await checkDeployedAddress(address);
  } catch (error) {
    console.warn('[pocketpig-server] deployed-check-failed', address, error);
    return null;
  }
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw);
}

function toHex(value) {
  if (typeof value === 'bigint') {
    return `0x${value.toString(16)}`;
  }

  if (typeof value === 'number') {
    return `0x${Math.trunc(value).toString(16)}`;
  }

  if (typeof value === 'string' && value.startsWith('0x')) {
    return value;
  }

  return `0x${BigInt(value).toString(16)}`;
}

function parseU256(values, offset = 0) {
  return BigInt(values[offset] ?? '0') + (BigInt(values[offset + 1] ?? '0') << 128n);
}

function toUint256Calldata(value) {
  const lowMask = (1n << 128n) - 1n;
  const low = value & lowMask;
  const high = value >> 128n;
  return [toHex(low), toHex(high)];
}

function formatBigIntAmount(rawAmount, decimals, precision = 4) {
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

function bigIntToDecimal(rawAmount, decimals) {
  return Number(formatBigIntAmount(rawAmount, decimals, Math.min(decimals, 8)));
}

function resolveDisplayedApr(value, fallback) {
  if (!Number.isFinite(value) || value <= 0 || value > 20) {
    return fallback;
  }

  return Number(value.toFixed(2));
}

function getTokenCatalog() {
  return network === 'sepolia' ? TOKEN_CATALOG.sepolia : TOKEN_CATALOG.mainnet;
}

async function fetchJson(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'User-Agent': 'PocketPig/1.0 (+local-dev)',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status}`);
  }

  return await response.json();
}

function getAvnuHeaders(overrides = {}) {
  return {
    Accept: 'application/json',
    ...(avnuApiKey ? { 'x-api-key': avnuApiKey } : {}),
    ...overrides,
  };
}

async function handleDcaOrders(res, url) {
  const traderAddress = normalizeText(url.searchParams.get('traderAddress'));
  const status = normalizeText(url.searchParams.get('status'));
  const page = normalizeText(url.searchParams.get('page')) ?? '0';
  const size = normalizeText(url.searchParams.get('size')) ?? '20';
  const sort = normalizeText(url.searchParams.get('sort'));

  if (!traderAddress) {
    return sendError(res, 400, 'invalid_request', 'traderAddress is required.');
  }

  const upstream = new URL(`${avnuBaseUrl}/dca/v3/orders`);
  upstream.searchParams.set('traderAddress', traderAddress);
  upstream.searchParams.set('page', page);
  upstream.searchParams.set('size', size);
  if (status) {
    upstream.searchParams.set('status', status);
  }
  if (sort) {
    upstream.searchParams.set('sort', sort);
  }

  const response = await fetch(upstream, {
    headers: getAvnuHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readUpstreamError(response));
  }

  sendJson(res, 200, await response.json());
}

async function handleDcaCreateCalls(req, res) {
  const body = await readJsonBody(req);
  const response = await fetch(`${avnuBaseUrl}/dca/v3/orders`, {
    method: 'POST',
    headers: getAvnuHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readUpstreamError(response));
  }

  sendJson(res, 200, await response.json());
}

async function handleDcaCancelCalls(req, res) {
  const body = await readJsonBody(req);
  const orderAddress = normalizeText(body?.orderAddress);

  if (!orderAddress) {
    return sendError(res, 400, 'invalid_request', 'orderAddress is required.');
  }

  const response = await fetch(`${avnuBaseUrl}/dca/v3/orders/${orderAddress}/cancel`, {
    method: 'POST',
    headers: getAvnuHeaders({
      'Content-Type': 'application/json',
    }),
  });

  if (!response.ok) {
    throw new Error(await readUpstreamError(response));
  }

  sendJson(res, 200, await response.json());
}

async function buildDcaCancelCalls(orderAddress) {
  const response = await fetch(`${avnuBaseUrl}/dca/v3/orders/${orderAddress}/cancel`, {
    method: 'POST',
    headers: getAvnuHeaders({
      'Content-Type': 'application/json',
    }),
  });

  if (!response.ok) {
    throw new Error(await readUpstreamError(response));
  }

  const payload = await response.json();
  return Array.isArray(payload?.calls) ? payload.calls : [];
}

async function fetchDcaOrdersForTrader(traderAddress) {
  const upstream = new URL(`${avnuBaseUrl}/dca/v3/orders`);
  upstream.searchParams.set('traderAddress', traderAddress);
  upstream.searchParams.set('page', '0');
  upstream.searchParams.set('size', '50');

  const response = await fetch(upstream, {
    headers: getAvnuHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readUpstreamError(response));
  }

  const payload = await response.json();
  return Array.isArray(payload?.content) ? payload.content : [];
}

function createTokenContract(tokenAddress, providerOrAccount = provider) {
  return new Contract({
    abi: ERC20_ABI,
    address: tokenAddress,
    providerOrAccount,
  }).typedv2(ERC20_ABI);
}

function createPoolContract(poolAddress, providerOrAccount = provider) {
  return new Contract({
    abi: POOL_ABI,
    address: poolAddress,
    providerOrAccount,
  }).typedv2(POOL_ABI);
}

async function buildNativeStakeCalls({
  accountAddress,
  poolAddress,
  tokenAddress,
  amountRaw,
  providerOrAccount = provider,
}) {
  const tokenContract = createTokenContract(tokenAddress, providerOrAccount);
  const poolContract = createPoolContract(poolAddress, providerOrAccount);
  const approveCall = tokenContract.populateTransaction.approve(poolAddress, amountRaw);
  const member = await poolContract.get_pool_member_info_v1(accountAddress);
  const stakeCall = member.isSome()
    ? poolContract.populateTransaction.add_to_delegation_pool(accountAddress, amountRaw)
    : poolContract.populateTransaction.enter_delegation_pool(accountAddress, amountRaw);
  return [approveCall, stakeCall];
}

async function executeSponsoredCalls(wallet, calls) {
  if (!Array.isArray(calls) || calls.length === 0) {
    throw new Error('No Starknet calls were provided for execution.');
  }

  if (avnuApiKey) {
    const response = await wallet.executePaymasterTransaction(calls, {
      feeMode: {
        mode: 'sponsored',
      },
    });
    const transactionHash = response.transaction_hash ?? response.transactionHash;
    if (!transactionHash) {
      throw new Error('Paymaster execution did not return a Starknet transaction hash.');
    }
    await provider.waitForTransaction(transactionHash);
    return transactionHash;
  }

  const response = await wallet.execute(calls);
  const transactionHash = response.transaction_hash ?? response.transactionHash ?? response.hash;
  if (!transactionHash) {
    throw new Error('Execution did not return a Starknet transaction hash.');
  }
  await provider.waitForTransaction(transactionHash);
  return transactionHash;
}

async function getVesuUsdcApyPercent() {
  const { singletonAddress, poolId, usdcAddress } = VESU_SAFE_CONFIG;

  const extensionAddress = (
    await provider.callContract({
      contractAddress: singletonAddress,
      entrypoint: 'extension',
      calldata: [poolId],
    })
  )[0];

  const utilization = await provider.callContract({
    contractAddress: singletonAddress,
    entrypoint: 'utilization',
    calldata: [poolId, usdcAddress],
  });

  const assetConfig = await provider.callContract({
    contractAddress: singletonAddress,
    entrypoint: 'asset_config',
    calldata: [poolId, usdcAddress],
  });

  const lastUpdated = assetConfig[13];
  const lastFullUtilizationRate = assetConfig.slice(16, 18);
  const feeRateRaw = parseU256(assetConfig, 18);

  const interestRate = await provider.callContract({
    contractAddress: extensionAddress,
    entrypoint: 'interest_rate',
    calldata: [
      poolId,
      usdcAddress,
      ...utilization,
      lastUpdated,
      ...lastFullUtilizationRate,
    ],
  });

  const borrowRatePerSecond = Number(parseU256(interestRate)) / Number(SCALE);
  const utilizationRatio = Number(parseU256(utilization)) / Number(SCALE);
  const feeRateRatio = Number(feeRateRaw) / Number(SCALE);
  const supplyRatePerSecond =
    borrowRatePerSecond * utilizationRatio * Math.max(0, 1 - feeRateRatio);

  return (Math.pow(1 + supplyRatePerSecond, SECONDS_PER_YEAR) - 1) * 100;
}

async function getAppStakeTotals() {
  if (!supabase) {
    return {
      configured: false,
      strkAmount: 0,
      btcAmount: 0,
      ethAmount: 0,
      usdcAmount: 0,
      updatedAt: null,
    };
  }

  const { data, error } = await supabase.rpc('pocketpig_app_totals');

  if (error) {
    throw new Error(error.message);
  }

  return {
    configured: true,
    strkAmount: Number(data?.total_strk ?? 0),
    btcAmount: Number(data?.total_btc ?? 0),
    ethAmount: Number(data?.total_eth ?? 0),
    usdcAmount: Number(data?.total_usdc ?? 0),
    updatedAt: data?.updated_at ?? null,
  };
}

async function getVesuSupplyApyPercent(assetAddress) {
  const { singletonAddress, poolId } = VESU_SAFE_CONFIG;

  const extensionAddress = (
    await provider.callContract({
      contractAddress: singletonAddress,
      entrypoint: 'extension',
      calldata: [poolId],
    })
  )[0];

  const utilization = await provider.callContract({
    contractAddress: singletonAddress,
    entrypoint: 'utilization',
    calldata: [poolId, assetAddress],
  });

  const assetConfig = await provider.callContract({
    contractAddress: singletonAddress,
    entrypoint: 'asset_config',
    calldata: [poolId, assetAddress],
  });

  const lastUpdated = assetConfig[13];
  const lastFullUtilizationRate = assetConfig.slice(16, 18);
  const feeRateRaw = parseU256(assetConfig, 18);

  const interestRate = await provider.callContract({
    contractAddress: extensionAddress,
    entrypoint: 'interest_rate',
    calldata: [
      poolId,
      assetAddress,
      ...utilization,
      lastUpdated,
      ...lastFullUtilizationRate,
    ],
  });

  const borrowRatePerSecond = Number(parseU256(interestRate)) / Number(SCALE);
  const utilizationRatio = Number(parseU256(utilization)) / Number(SCALE);
  const feeRateRatio = Number(feeRateRaw) / Number(SCALE);
  const supplyRatePerSecond =
    borrowRatePerSecond * utilizationRatio * Math.max(0, 1 - feeRateRatio);

  return (Math.pow(1 + supplyRatePerSecond, SECONDS_PER_YEAR) - 1) * 100;
}

async function buildMarketOverview() {
  const cached = marketCache.value;
  if (cached && marketCache.expiresAt > Date.now()) {
    return cached;
  }

  const [[usdcApy, ethApy], totals] = await Promise.all([
    Promise.all([
      getVesuSupplyApyPercent(VESU_SAFE_CONFIG.usdcAddress).catch(() => 2),
      getVesuSupplyApyPercent(getTokenCatalog().ETH.address).catch(() => 0.5),
    ]),
    getAppStakeTotals(),
  ]);

  const overview = {
    updatedAt: new Date().toISOString(),
    rates: {
      grow: {
        mode: 'grow',
        assetSymbol: 'STRK',
        protocolLabel: 'Starknet native staking',
        yieldLabel: 'APR',
        ratePercent: resolveDisplayedApr(REFERENCE_APRS.grow, REFERENCE_APRS.grow),
      },
      bitcoin: {
        mode: 'bitcoin',
        assetSymbol: 'BTC',
        protocolLabel: 'Starknet BTC staking',
        yieldLabel: 'APR',
        ratePercent: resolveDisplayedApr(REFERENCE_APRS.bitcoin, REFERENCE_APRS.bitcoin),
      },
      eth: {
        mode: 'eth',
        assetSymbol: 'ETH',
        protocolLabel: 'Vesu supply',
        yieldLabel: 'APY',
        ratePercent: Number(ethApy.toFixed(2)),
      },
      safe: {
        mode: 'safe',
        assetSymbol: 'USDC',
        protocolLabel: 'Vesu supply',
        yieldLabel: 'APY',
        ratePercent: Number(usdcApy.toFixed(2)),
      },
    },
    totals: {
      ...totals,
      strkAmount: Number(totals.strkAmount.toFixed(4)),
      btcAmount: Number(totals.btcAmount.toFixed(8)),
      ethAmount: Number(totals.ethAmount.toFixed(6)),
      usdcAmount: Number(totals.usdcAmount.toFixed(2)),
    },
  };

  marketCache.value = overview;
  marketCache.expiresAt = Date.now() + 5 * 60 * 1000;
  return overview;
}

async function requirePrivyUser(req) {
  if (!privyClient || !privyAppId || !privyVerificationKey) {
    throw new Error('Privy server configuration is incomplete.');
  }

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    const authError = new Error('Missing bearer access token.');
    authError.statusCode = 401;
    throw authError;
  }

  const verification = await verifyAccessToken({
    access_token: accessToken,
    app_id: privyAppId,
    verification_key: privyVerificationKey,
  });

  return {
    accessToken,
    userId: verification.user_id,
  };
}

async function getOrCreateStarknetWallet(userId, preferredAddress = null) {
  if (!privyClient) {
    throw new Error('Privy client not initialized.');
  }

  const existingWallets = [];
  for await (const wallet of privyClient.wallets().list({
    user_id: userId,
    chain_type: 'starknet',
    })) {
    existingWallets.push(wallet);
  }

  const normalizedPreferredAddress = normalizeText(preferredAddress)?.toLowerCase() ?? null;
  const matchedWallet =
    normalizedPreferredAddress
      ? existingWallets.find(
          (wallet) =>
            typeof wallet.address === 'string' &&
            wallet.address.toLowerCase() === normalizedPreferredAddress,
        ) ?? null
      : null;

  const wallet =
    matchedWallet ??
    existingWallets[0] ??
    (await privyClient.wallets().create({
      chain_type: 'starknet',
      owner: {
        user_id: userId,
      },
      'privy-idempotency-key': randomUUID(),
    }));

  if (!wallet.public_key) {
    throw new Error('Privy Starknet wallet public key is missing.');
  }

  return wallet;
}

function normalizeNumeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value, fallback = null) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function amountToRawString(amount, decimals) {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const normalized = safeAmount.toFixed(decimals);
  const [wholePart, fractionPart = ''] = normalized.split('.');
  const whole = BigInt(wholePart || '0');
  const fraction = BigInt(fractionPart.padEnd(decimals, '0').slice(0, decimals) || '0');
  const raw = whole * 10n ** BigInt(decimals) + fraction;
  return `0x${raw.toString(16)}`;
}

function compactAmount(value, digits = 6) {
  return Number(value).toFixed(digits).replace(/\.?0+$/, '');
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function dateKeyToUtc(dateKey) {
  return new Date(`${dateKey}T00:00:00Z`).getTime();
}

function diffDays(left, right) {
  return Math.round((dateKeyToUtc(left) - dateKeyToUtc(right)) / 86_400_000);
}

function normalizeUsdValue(entry) {
  return Math.max(0, Number(entry.usdValue ?? 0));
}

function getDailyBaseXp(level) {
  return 40 + Math.floor(Math.max(0, level - 1) / 5) * 5;
}

function getVolumeXp(usdValue) {
  return Math.min(60, Math.floor(Math.max(0, usdValue) / 5) * 2);
}

function getCommitmentBonus(entry) {
  return entry.eventType === 'dca_create' ? 35 : 0;
}

function getDiversityBonus(existingEntries, nextEntry) {
  const recentUniqueDays = Array.from(new Set(existingEntries.map((entry) => entry.date)))
    .sort()
    .slice(-7);

  const recentModes = new Set(
    existingEntries
      .filter((entry) => recentUniqueDays.includes(entry.date))
      .map((entry) => entry.mode),
  );

  return recentModes.has(nextEntry.mode) ? 0 : 15;
}

function getStreakBonus(streak) {
  const table = {
    3: 20,
    7: 50,
    14: 100,
    30: 250,
    90: 600,
    180: 1400,
    365: 4000,
  };
  return table[streak] ?? 0;
}

function getXpRequiredForLevel(level) {
  return Math.max(120, Math.round(120 * level ** 1.18 + 40 * level));
}

function resolveInfiniteLevel(totalXp) {
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
  };
}

function computeDailyStreak(feedEntries, todayKey) {
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

function computeLongestStreak(feedEntries) {
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

function buildBadgeUnlockMap(feedEntries) {
  const sortedEntries = [...feedEntries].sort((left, right) => left.date.localeCompare(right.date));
  const unlocked = new Map();
  let totalVolumeUsd = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let previousDay = null;
  const modeDays = {
    safe: new Set(),
    bitcoin: new Set(),
    grow: new Set(),
    eth: new Set(),
  };
  let totalActions = 0;
  let dcaCreateCount = 0;

  for (const entry of sortedEntries) {
    totalVolumeUsd += normalizeUsdValue(entry);
    totalActions += 1;
    if (entry.eventType === 'dca_create') {
      dcaCreateCount += 1;
    }
    if (modeDays[entry.mode]) {
      modeDays[entry.mode].add(entry.date);
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

    const checks = [
      ['streak-7', longestStreak >= 7, 90],
      ['discipline-30', longestStreak >= 30, 320],
      ['discipline-100', longestStreak >= 100, 1400],
      ['volume-1k', totalVolumeUsd >= 1_000, 300],
      ['volume-10k', totalVolumeUsd >= 10_000, 1800],
      ['feeds-50', totalActions >= 50, 450],
      ['feeds-200', totalActions >= 200, 2400],
      [
        'asset-all',
        modeDays.safe.size > 0 &&
          modeDays.bitcoin.size > 0 &&
          modeDays.grow.size > 0 &&
          modeDays.eth.size > 0,
        500,
      ],
      ['strk-veteran', modeDays.grow.size >= 20, 650],
      ['bitcoin-conviction', modeDays.bitcoin.size >= 20, 650],
      ['eth-earner', modeDays.eth.size >= 20, 650],
      ['usdc-steward', modeDays.safe.size >= 20, 650],
      ['dca-starter', dcaCreateCount >= 3, 350],
    ];

    for (const [badgeId, earned, xpAwarded] of checks) {
      if (earned && !unlocked.has(badgeId)) {
        unlocked.set(badgeId, xpAwarded);
      }
    }
  }

  return unlocked;
}

function getBadgeBonusForNextFeed(existingEntries, nextEntry) {
  const before = buildBadgeUnlockMap(existingEntries);
  const after = buildBadgeUnlockMap([...existingEntries, nextEntry]);
  let bonus = 0;
  for (const [badgeId, xpAwarded] of after.entries()) {
    if (!before.has(badgeId)) {
      bonus += Number(xpAwarded);
    }
  }
  return bonus;
}

async function fetchPocketPigStateForUser(userId, walletAddress) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc('pocketpig_state', {
    p_user_id: userId,
    p_wallet_address: walletAddress?.toLowerCase() ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data?.state ?? null;
}

async function syncProgressFeedEvent({
  userId,
  walletAddress,
  userName,
  mode,
  txHash,
  amount,
  usdValue,
  assetSymbol,
  protocol = null,
  cadence = null,
  iterations = null,
  orderAddress = null,
  sourceAmountDisplay = null,
  targetAmountDisplay = null,
  targetAmountUsd = null,
  targetSymbol = null,
  eventType = 'feed',
}) {
  if (!supabase) {
    return { xp: 0 };
  }

  const remoteState = await fetchPocketPigStateForUser(userId, walletAddress);
  const existingEntries = Array.isArray(remoteState?.feedEntries)
    ? remoteState.feedEntries.map((entry) => ({
        date: String(entry.date),
        mode: String(entry.mode),
        xp: Number(entry.xp ?? 0),
        usdValue: entry.usdValue == null ? null : Number(entry.usdValue),
        eventType: entry.eventType === 'dca_create' ? 'dca_create' : 'feed',
        assetSymbol: typeof entry.assetSymbol === 'string' ? entry.assetSymbol : null,
      }))
    : [];
  const todayKey = toDateKey(new Date());
  const levelProgress = resolveInfiniteLevel(
    existingEntries.reduce((sum, entry) => sum + Number(entry.xp ?? 0), 0),
  );
  const baseEntry = {
    date: todayKey,
    mode,
    xp: 0,
    usdValue,
    eventType,
    assetSymbol,
  };
  const fedToday = existingEntries.some((entry) => entry.date === todayKey);
  const badgeBonus = getBadgeBonusForNextFeed(existingEntries, baseEntry);

  let earnedXp = badgeBonus;
  if (!fedToday) {
    const nextStreak = computeDailyStreak([...existingEntries, baseEntry], todayKey);
    earnedXp =
      getDailyBaseXp(levelProgress.level) +
      getVolumeXp(Number(usdValue ?? 0)) +
      getCommitmentBonus(baseEntry) +
      getDiversityBonus(existingEntries, baseEntry) +
      getStreakBonus(nextStreak) +
      badgeBonus;
  }

  const nextEntries = [
    ...(remoteState?.feedEntries ?? []),
    {
      date: todayKey,
      amount,
      mode,
      xp: earnedXp,
      eventType,
      protocol,
      cadence,
      iterations,
      orderAddress,
      assetSymbol,
      usdValue,
      priceUsd: null,
      txHash,
      targetSymbol,
      sourceAmountDisplay,
      targetAmountDisplay,
      targetAmountUsd,
    },
  ];

  const totalXp = nextEntries.reduce((sum, entry) => sum + Number(entry.xp ?? 0), 0);
  const levelState = resolveInfiniteLevel(totalXp);
  const streak = computeDailyStreak(nextEntries, todayKey);
  const longestStreak = computeLongestStreak(nextEntries);
  const totalSaved = nextEntries.reduce(
    (sum, entry) => sum + Number(entry.usdValue ?? entry.targetAmountUsd ?? 0),
    0,
  );

  const payload = {
    user: {
      userId,
      walletAddress,
      providerKind: 'privy',
      userName,
      userEmail: null,
      referralCode: remoteState?.referralCode ?? 'PP-PIGGYX',
    },
    settings: {
      mode: remoteState?.mode ?? 'grow',
      growAmount: Number(remoteState?.dailyAmount ?? 1),
      ethAmount: Number(remoteState?.ethAmount ?? 0.01),
      bitcoinAmount: Number(remoteState?.bitcoinAmount ?? 0.00000001),
      usdcAmount: Number(remoteState?.targetUsdAmount ?? 25),
      notifications: Boolean(remoteState?.notifications ?? true),
      autoFeed: Boolean(remoteState?.autoFeed ?? false),
      pigSkin: remoteState?.pigSkin ?? 'classic',
    },
    progress: {
      xp: totalXp,
      lifetimeXp: levelState.lifetimeXp,
      streak,
      longestStreak,
      level: levelState.level,
      totalSaved: Number(totalSaved.toFixed(2)),
      fedToday: true,
    },
    balances: [],
    positions: [],
    feedEvents: nextEntries.map((entry) => ({
      txHash: entry.txHash ?? `entry-${entry.date}-${Math.random()}`,
      date: entry.date,
      mode: entry.mode,
      amount: Number(entry.amount ?? 0),
      xp: Number(entry.xp ?? 0),
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
  };

  const { error } = await supabase.rpc('pocketpig_sync', {
    payload,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { xp: earnedXp };
}

async function handleResolve(req, res) {
  const { userId } = await requirePrivyUser(req);
  const body = await readJsonBody(req);
  const preferredAddress =
    normalizeText(body?.walletAddress)?.toLowerCase() ??
    normalizeText(body?.linkedAccounts?.find?.((account) => account?.type === 'wallet' && account?.chainType === 'starknet')?.address)?.toLowerCase() ??
    null;
  const wallet = await getOrCreateStarknetWallet(userId, preferredAddress);
  const deployed = wallet.address ? await safeCheckDeployedAddress(wallet.address) : false;

  sendJson(res, 200, {
    walletId: wallet.id,
    address: wallet.address,
    publicKey: wallet.public_key,
    deployed,
  });
}

async function handleSign(req, res) {
  const { accessToken, userId } = await requirePrivyUser(req);
  const body = await readJsonBody(req);
  const walletId = typeof body.walletId === 'string' ? body.walletId : '';
  const hash =
    typeof body.hash === 'string'
      ? body.hash
      : typeof body?.params?.hash === 'string'
        ? body.params.hash
        : '';
  const preferredAddress = normalizeText(body?.walletAddress)?.toLowerCase() ?? null;

  if (!walletId || !isHexHash(hash)) {
    return sendError(res, 400, 'invalid_request', 'walletId and hash are required.');
  }

  const wallet = await getOrCreateStarknetWallet(userId, preferredAddress);
  if (wallet.id !== walletId) {
    return sendError(
      res,
      403,
      'wallet_mismatch',
      'Requested wallet does not belong to the authenticated user.',
    );
  }

  const result = await privyClient.wallets().rawSign(walletId, {
    params: { hash },
    authorization_context: {
      user_jwts: [accessToken],
    },
    idempotency_key: randomUUID(),
  });

  sendJson(res, 200, {
    signature: result.signature,
  });
}

async function handleMarketOverview(res) {
  const overview = await buildMarketOverview();
  sendJson(res, 200, overview);
}

async function handleWeeklyLeaderboard(res, url) {
  if (!supabase) {
    return sendJson(res, 200, {
      configured: false,
      entries: [],
    });
  }

  const userId = normalizeText(url.searchParams.get('userId'));
  const walletAddress = normalizeText(url.searchParams.get('walletAddress'))?.toLowerCase() ?? null;
  const { data, error } = await supabase.rpc('pocketpig_weekly_leaderboard', {
    p_user_id: userId,
    p_wallet_address: walletAddress,
  });

  if (error) {
    console.warn('[pocketpig-server] weekly-leaderboard-failed', error.message);
    return sendJson(res, 200, {
      configured: true,
      entries: [],
    });
  }

  sendJson(res, 200, {
    configured: true,
    entries: Array.isArray(data?.entries) ? data.entries : [],
  });
}

async function handleSupabaseState(req, res, url) {
  if (!supabase) {
    return sendJson(res, 200, {
      configured: false,
      found: false,
      state: null,
    });
  }

  const userId = normalizeText(url.searchParams.get('userId'));
  const walletAddress = normalizeText(url.searchParams.get('walletAddress'))?.toLowerCase() ?? null;

  if (!userId && !walletAddress) {
    return sendError(res, 400, 'invalid_request', 'userId or walletAddress is required.');
  }

  const { data, error } = await supabase.rpc('pocketpig_state', {
    p_user_id: userId,
    p_wallet_address: walletAddress,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.found) {
    return sendJson(res, 200, {
      configured: true,
      found: false,
      state: null,
    });
  }

  sendJson(res, 200, {
    configured: true,
    found: Boolean(data?.found),
    state: data?.state ?? null,
  });
}

async function handleSupabaseSync(req, res) {
  if (!supabase) {
    return sendJson(res, 200, {
      ok: true,
      configured: false,
    });
  }

  const body = await readJsonBody(req);
  const { data, error } = await supabase.rpc('pocketpig_sync', {
    payload: body,
  });

  if (error) {
    throw new Error(error.message);
  }

  marketCache.expiresAt = 0;
  sendJson(res, 200, {
    ok: data?.ok ?? true,
    configured: true,
  });
}

async function handleSupabaseDcaSync(req, res) {
  if (!supabase) {
    return sendJson(res, 200, {
      ok: true,
      configured: false,
    });
  }

  const body = await readJsonBody(req);
  const { data, error } = await supabase.rpc('pocketpig_sync_dca', {
    payload: body,
  });

  if (error) {
    throw new Error(error.message);
  }

  sendJson(res, 200, {
    ok: data?.ok ?? true,
    configured: true,
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      const paymasterStatus = await fetchPaymasterStatus();
      sendJson(res, 200, {
        ok: true,
        network,
        rpcUrl,
        privyConfigured: Boolean(privyClient && privyVerificationKey),
        supabaseConfigured: Boolean(supabase),
        paymasterNodeUrl: avnuPaymasterNodeUrl,
        paymasterConfigured: Boolean(avnuApiKey),
        paymasterOk: paymasterStatus.configured ? paymasterStatus.ok : false,
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/paymaster/status') {
      sendJson(res, 200, await fetchPaymasterStatus());
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/market/overview') {
      await handleMarketOverview(res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/leaderboard/weekly') {
      await handleWeeklyLeaderboard(res, url);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/dca/orders') {
      await handleDcaOrders(res, url);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/dca/orders/calls') {
      await handleDcaCreateCalls(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/dca/orders/cancel-calls') {
      await handleDcaCancelCalls(req, res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/supabase/state') {
      await handleSupabaseState(req, res, url);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/supabase/sync') {
      await handleSupabaseSync(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/supabase/dca-sync') {
      await handleSupabaseDcaSync(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/privy/starknet/resolve') {
      await handleResolve(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/privy/starknet/sign') {
      await handleSign(req, res);
      return;
    }

    sendError(res, 404, 'not_found', 'Route not found.');
  } catch (error) {
    console.error('[pocketpig-server]', req.method, url.pathname, error);
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : 500;

    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';

    sendError(res, statusCode, 'server_error', message);
  }
});

server.listen(port, () => {
  console.log(`[pocketpig-server] listening on http://localhost:${port}`);
});
