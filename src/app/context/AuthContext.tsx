import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getStarknet, type StarknetWindowObject } from '@starknet-io/get-starknet-core';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import type { AccountInterface } from 'starknet';
import { WalletAccount } from 'starknet';
import { StarkZap } from '../../vendor/starkzap/sdk';
import { OnboardStrategy } from '../../vendor/starkzap/onboard';
import { appEnv, hasPrivyConfig, hasStarkzapPrivyResolveUrl } from '../../lib/env';

type SocialLoginMethod = 'google';
type WalletStatus =
  | 'unconfigured'
  | 'idle'
  | 'authenticating'
  | 'authenticated'
  | 'activating'
  | 'active'
  | 'needs_backend'
  | 'error';
type ProviderKind = 'privy' | 'cartridge' | 'native' | null;

interface NativeWalletOption {
  id: string;
  name: string;
  icon: string;
}

interface AuthContextValue {
  authReady: boolean;
  authConfigured: boolean;
  privyConfigured: boolean;
  authenticated: boolean;
  providerKind: ProviderKind;
  account: AccountInterface | null;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  walletAddress: string | null;
  walletLabel: string;
  walletSourceLabel: string;
  walletStatus: WalletStatus;
  walletDeployed: boolean | null;
  walletError: string | null;
  canActivateWallet: boolean;
  availableNativeWallets: NativeWalletOption[];
  nativeWalletsLoading: boolean;
  nativeWalletPendingId: string | null;
  getPrivyAccessToken: () => Promise<string | null>;
  loginWith: (method: SocialLoginMethod) => Promise<void>;
  loginWithCartridge: () => Promise<void>;
  connectNativeWallet: (walletId: string) => Promise<void>;
  refreshNativeWallets: () => Promise<void>;
  activateWallet: () => Promise<boolean>;
  walletReadyForTransactions: boolean;
  logout: () => Promise<void>;
}

interface ResolvePayload {
  walletId: string;
  publicKey: string;
  address?: string;
  deployed?: boolean | null;
  metadata?: Record<string, unknown>;
}

interface LinkedAccount {
  type?: string;
  email?: string;
  address?: string;
  username?: string;
  subject?: string;
  name?: string;
}

interface PrivyBindings {
  ready: boolean;
  authenticated: boolean;
  user: unknown;
  login: ReturnType<typeof usePrivy>['login'];
  logout: ReturnType<typeof usePrivy>['logout'];
  getAccessToken: ReturnType<typeof usePrivy>['getAccessToken'];
  signRawHash?: (input: {
    address: string;
    chainType: 'starknet';
    hash: `0x${string}`;
  }) => Promise<{ signature: `0x${string}` }>;
}

interface ExternalSession {
  providerKind: Exclude<ProviderKind, 'privy' | null>;
  userId: string;
  userName: string;
  userEmail: string | null;
  walletAddress: string;
  walletLabel: string;
  walletSourceLabel: string;
}

interface CartridgeWalletLike {
  address: string;
  disconnect: () => Promise<void>;
  username?: () => Promise<string | undefined>;
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
const starknetConnector = getStarknet();
const AuthContext = createContext<AuthContextValue | null>(null);

function compactAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatWalletError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message) {
    return fallback;
  }

  if (message.includes('User abort') || message.includes('rejected')) {
    return 'Wallet connection was cancelled by the user.';
  }

  if (message.includes('timeout')) {
    return 'The wallet did not respond in time. Open the extension and try again.';
  }

  return message;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function waitForWalletDeployment(address: string, options?: { attempts?: number; delayMs?: number }) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 2500;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const classHash = await sdk.getProvider().getClassHashAt(address);
      if (classHash) {
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (!message.includes('contract not found') && !message.includes('contract_not_found')) {
        throw error;
      }
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

function readLinkedAccounts(user: unknown): LinkedAccount[] {
  if (!user || typeof user !== 'object') {
    return [];
  }

  const candidate = user as { linkedAccounts?: unknown };
  return Array.isArray(candidate.linkedAccounts)
    ? (candidate.linkedAccounts as LinkedAccount[])
    : [];
}

function resolveUserEmail(user: unknown) {
  const accounts = readLinkedAccounts(user);
  const emailAccount = accounts.find((account) => {
    const type = account.type ?? '';
    return type.includes('email') || type.includes('google') || type.includes('apple');
  });

  return emailAccount?.email ?? null;
}

function normalizeUserName(value: string | null | undefined) {
  if (!value) {
    return 'Piggy Saver';
  }

  const baseName = value.split('@')[0]?.trim();
  if (!baseName) {
    return 'Piggy Saver';
  }

  return baseName
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveUserName(user: unknown) {
  const accounts = readLinkedAccounts(user);
  const preferredAccount = accounts.find(
    (account) => account.name || account.username || account.email,
  );

  return normalizeUserName(
    preferredAccount?.name ?? preferredAccount?.username ?? preferredAccount?.email ?? null,
  );
}

function normalizeWalletIcon(icon: StarknetWindowObject['icon']) {
  if (typeof icon === 'string') {
    return icon;
  }

  return icon.light || icon.dark || '';
}

async function readWalletAddress(
  wallet: StarknetWindowObject,
  options?: { silent?: boolean },
) {
  const request =
    options?.silent
      ? {
          type: 'wallet_requestAccounts' as const,
          params: {
            silent_mode: true,
          },
        }
      : {
          type: 'wallet_requestAccounts' as const,
        };

  const accounts = await wallet.request(request);

  if (!accounts.length) {
    throw new Error('The wallet connected, but no active account was found.');
  }

  return accounts[0];
}

function AuthRuntimeProvider({
  children,
  privy,
}: {
  children: React.ReactNode;
  privy?: PrivyBindings;
}) {
  const [externalSession, setExternalSession] = useState<ExternalSession | null>(null);
  const [availableNativeWallets, setAvailableNativeWallets] = useState<
    NativeWalletOption[]
  >([]);
  const [nativeWalletsLoading, setNativeWalletsLoading] = useState(false);
  const [nativeWalletPendingId, setNativeWalletPendingId] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('idle');
  const [walletDeployed, setWalletDeployed] = useState<boolean | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [privyWalletAddress, setPrivyWalletAddress] = useState<string | null>(null);
  const [activeAccount, setActiveAccount] = useState<AccountInterface | null>(null);
  const nativeWalletRef = useRef<StarknetWindowObject | null>(null);
  const cartridgeWalletRef = useRef<CartridgeWalletLike | null>(null);

  const providerKind: ProviderKind = externalSession?.providerKind
    ? externalSession.providerKind
    : privy?.authenticated
      ? 'privy'
      : null;

  const clearExternalSession = useCallback(
    async (options?: { clearNativeLastWallet?: boolean }) => {
      if (options?.clearNativeLastWallet !== false) {
        await starknetConnector.disconnect({ clearLastWallet: true });
      }

      if (cartridgeWalletRef.current) {
        await cartridgeWalletRef.current.disconnect().catch(() => undefined);
      }

      nativeWalletRef.current = null;
      cartridgeWalletRef.current = null;
      setActiveAccount(null);
      setExternalSession(null);
      setWalletDeployed(null);
    },
    [],
  );

  const refreshNativeWallets = useCallback(async () => {
    setNativeWalletsLoading(true);
    try {
      const wallets = await starknetConnector.getAvailableWallets();
      setAvailableNativeWallets(
        wallets.map((wallet) => ({
          id: wallet.id,
          name: wallet.name,
          icon: normalizeWalletIcon(wallet.icon),
        })),
      );
    } catch {
      setAvailableNativeWallets([]);
    } finally {
      setNativeWalletsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshNativeWallets();
  }, [refreshNativeWallets]);

  useEffect(() => {
    if (privy?.authenticated) {
      setWalletStatus((current) =>
        externalSession ? current : current === 'active' ? current : 'authenticated',
      );
      return;
    }

    if (!externalSession) {
      setPrivyWalletAddress(null);
      setActiveAccount(null);
      setWalletDeployed(null);
      setWalletError(null);
      setWalletStatus(hasPrivyConfig ? 'idle' : 'unconfigured');
    }
  }, [externalSession, privy?.authenticated]);

  useEffect(() => {
    if (externalSession || privy?.authenticated) {
      return;
    }

    let cancelled = false;

    async function restoreNativeWallet() {
      try {
        const lastWallet = await starknetConnector.getLastConnectedWallet();
        if (!lastWallet) {
          return;
        }

        const enabledWallet = await starknetConnector.enable(lastWallet, {
          silent_mode: true,
        });
        const address = await readWalletAddress(enabledWallet, { silent: true });
        if (cancelled) {
          return;
        }

        nativeWalletRef.current = enabledWallet;
        setActiveAccount(
          new WalletAccount({
            provider: sdk.getProvider(),
            walletProvider: enabledWallet as never,
            address,
          }),
        );
        setExternalSession({
          providerKind: 'native',
          userId: `native:${address.toLowerCase()}`,
          userName: enabledWallet.name,
          userEmail: null,
          walletAddress: address,
          walletLabel: compactAddress(address),
          walletSourceLabel: enabledWallet.name,
        });
        setWalletDeployed(true);
        setWalletError(null);
        setWalletStatus('active');
      } catch {
        await starknetConnector.disconnect({ clearLastWallet: true });
      }
    }

    void restoreNativeWallet();

    return () => {
      cancelled = true;
    };
  }, [externalSession, privy?.authenticated]);

  const loginWith = useCallback(
    async (method: SocialLoginMethod) => {
      if (!privy) {
        setWalletStatus('unconfigured');
        setWalletError(
          'Privy App ID is missing. Add Privy settings to the .env file to enable social login.',
        );
        return;
      }

      await clearExternalSession();
      setWalletError(null);
      setWalletStatus('authenticating');
      privy.login({
        loginMethods: [method] as never,
      });
    },
    [clearExternalSession, privy],
  );

  const loginWithCartridge = useCallback(async () => {
    try {
      await clearExternalSession();
      if (privy?.authenticated) {
        await privy.logout();
      }

      setWalletError(null);
      setWalletStatus('authenticating');

      const wallet = (await sdk.connectCartridge({
        feeMode: 'sponsored',
      })) as CartridgeWalletLike;
      const username = await wallet.username?.().catch(() => undefined);
      if ('ensureReady' in wallet && typeof wallet.ensureReady === 'function') {
        await (wallet as unknown as { ensureReady: (options?: { deploy?: 'if_needed' }) => Promise<void> }).ensureReady({
          deploy: 'if_needed',
        });
      }

      cartridgeWalletRef.current = wallet;
      if ('getAccount' in wallet && typeof wallet.getAccount === 'function') {
        setActiveAccount(
          (wallet as unknown as { getAccount: () => AccountInterface }).getAccount(),
        );
      }
      setExternalSession({
        providerKind: 'cartridge',
        userId: `cartridge:${wallet.address.toLowerCase()}`,
        userName: normalizeUserName(username ?? 'Cartridge Player'),
        userEmail: null,
        walletAddress: wallet.address,
        walletLabel: compactAddress(wallet.address),
        walletSourceLabel: 'Cartridge',
      });
      setWalletDeployed(true);
      setWalletStatus('active');
    } catch (error) {
      setWalletStatus('error');
      setWalletError(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while connecting Cartridge.',
      );
    }
  }, [clearExternalSession, privy]);

  const connectNativeWallet = useCallback(
    async (walletId: string) => {
      if (nativeWalletPendingId) {
        return;
      }

      try {
        setNativeWalletPendingId(walletId);
        await clearExternalSession({ clearNativeLastWallet: true });
        if (privy?.authenticated) {
          await privy.logout();
        }

        setWalletError(null);
        setWalletStatus('authenticating');

        const wallets = await starknetConnector.getAvailableWallets();
        const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
        if (!selectedWallet) {
          throw new Error('The selected Starknet wallet could not be found.');
        }

        const enabledWallet = await withTimeout(
          starknetConnector.enable(selectedWallet),
          20000,
          `${selectedWallet.name} zamaninda yanit vermedi.`,
        );
        const address = await withTimeout(
          readWalletAddress(enabledWallet),
          15000,
          `${selectedWallet.name} hesap secimini tamamlamadi.`,
        );

        nativeWalletRef.current = enabledWallet;
        setActiveAccount(
          new WalletAccount({
            provider: sdk.getProvider(),
            walletProvider: enabledWallet as never,
            address,
          }),
        );
        setExternalSession({
          providerKind: 'native',
          userId: `native:${address.toLowerCase()}`,
          userName: enabledWallet.name,
          userEmail: null,
          walletAddress: address,
          walletLabel: compactAddress(address),
          walletSourceLabel: enabledWallet.name,
        });
        setWalletDeployed(true);
        setWalletStatus('active');
        await refreshNativeWallets();
      } catch (error) {
        setWalletStatus('error');
        setWalletError(
          formatWalletError(
            error,
            'An unknown error occurred while connecting the native wallet.',
          ),
        );
      } finally {
        setNativeWalletPendingId(null);
      }
    },
    [clearExternalSession, nativeWalletPendingId, privy, refreshNativeWallets],
  );

  const buildPrivyResolve = useCallback(async () => {
    if (!privy?.authenticated) {
      throw new Error('Privy session is not ready.');
    }

    const accessToken = await privy.getAccessToken();
    if (!accessToken) {
      throw new Error('Privy access token could not be retrieved.');
    }

    const response = await fetch(appEnv.starkzapPrivyResolveUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: (privy.user as { id?: string } | null)?.id ?? null,
        walletAddress: privyWalletAddress ?? null,
        linkedAccounts: readLinkedAccounts(privy.user),
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Wallet activation failed.');
    }

    const payload = (await response.json()) as ResolvePayload;

    return {
      payload,
      resolve: async () => {
        const signingAddress = payload.address ?? privyWalletAddress;
        if (!signingAddress) {
          throw new Error('Privy Starknet wallet address is not available.');
        }
        if (!privy.signRawHash) {
          throw new Error('Privy Starknet signing is not available in this session.');
        }

        return {
          walletId: payload.walletId,
          publicKey: payload.publicKey,
          rawSign: async (_walletId: string, hash: string) => {
            const result = await privy.signRawHash?.({
              address: signingAddress,
              chainType: 'starknet',
              hash: hash as `0x${string}`,
            });

            if (!result?.signature) {
              throw new Error('Privy Starknet signing failed.');
            }

            return result.signature;
          },
          metadata: payload.metadata,
        };
      },
    };
  }, [privy, privyWalletAddress]);

  const connectPrivyWallet = useCallback(
    async (
      deployMode: 'if_needed' | 'never',
      options?: { showProgress?: boolean; suppressErrors?: boolean },
    ) => {
      if (!privy?.authenticated || providerKind !== 'privy') {
        return false;
      }

      if (!hasStarkzapPrivyResolveUrl) {
        const message =
          'Privy login completed, but the StarkZap Privy resolve endpoint is not configured.';
        setWalletError(message);
        setWalletStatus('needs_backend');
        return false;
      }

      if (options?.showProgress !== false) {
        setWalletError(null);
        setWalletStatus('activating');
      }

      try {
        const { payload, resolve } = await buildPrivyResolve();
        if (payload.address) {
          setPrivyWalletAddress(payload.address);
        }

        const onboardWithDeployMode = async (mode: 'if_needed' | 'never') =>
          withTimeout(
            sdk.onboard({
              strategy: OnboardStrategy.Privy,
              feeMode: 'sponsored',
              deploy: mode,
              privy: { resolve },
            }),
            30000,
            'Wallet activation timed out. Try again.',
          );

        let result;
        try {
          result = await onboardWithDeployMode(deployMode);
        } catch (error) {
          const message = error instanceof Error ? error.message.toLowerCase() : '';
          if (deployMode !== 'if_needed' || !message.includes('already deployed')) {
            throw error;
          }
          result = await onboardWithDeployMode('never');
        }

        setPrivyWalletAddress(result.wallet.address);
        setActiveAccount(result.wallet.getAccount());
        const deployed =
          (result.deployed ?? false) ||
          (await result.wallet.isDeployed().catch(() => false)) ||
          (await waitForWalletDeployment(result.wallet.address));

        setWalletDeployed(deployed);
        if (!deployed) {
          setWalletStatus('authenticated');
          if (!options?.suppressErrors) {
            setWalletError(
              'The wallet deploy transaction was sent, but it has not been confirmed onchain yet. Try again shortly.',
            );
          }
          return false;
        }

        setWalletError(null);
        setWalletStatus('active');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (
          deployMode === 'never' &&
          (message.includes('contract not found') || message.includes('contract_not_found'))
        ) {
          setWalletDeployed(false);
          setWalletStatus('authenticated');
          if (!options?.suppressErrors) {
            setWalletError('This social wallet has not been deployed on Starknet yet.');
          }
          return false;
        }
        setWalletStatus('authenticated');
        if (!options?.suppressErrors) {
          setWalletError(
            error instanceof Error
              ? error.message
              : 'An unknown error occurred during wallet activation.',
          );
        }
        return false;
      }
    },
    [buildPrivyResolve, privy, providerKind],
  );

  const activateWallet = useCallback(async () => {
    if (providerKind !== 'privy' || !privy?.authenticated) {
      return providerKind === 'native' || providerKind === 'cartridge';
    }

    return connectPrivyWallet('if_needed', { showProgress: true });
  }, [connectPrivyWallet, privy, providerKind]);

  useEffect(() => {
    if (externalSession || !privy?.authenticated || activeAccount) {
      return;
    }

    let cancelled = false;

    const hydratePrivyWallet = async () => {
      try {
        const accessToken = await privy.getAccessToken();
        if (!accessToken) {
          return;
        }

        const response = await fetch(appEnv.starkzapPrivyResolveUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: (privy.user as { id?: string } | null)?.id ?? null,
            linkedAccounts: readLinkedAccounts(privy.user),
          }),
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ResolvePayload;
        if (cancelled) {
          return;
        }

        if (payload.address) {
          setPrivyWalletAddress(payload.address);
        }
        if (typeof payload.deployed === 'boolean') {
          setWalletDeployed(payload.deployed);
          if (payload.deployed) {
            void connectPrivyWallet('never', {
              showProgress: false,
              suppressErrors: true,
            });
            return;
          }
        }
        if (payload.deployed === null || typeof payload.deployed === 'undefined') {
          const connected = await connectPrivyWallet('never', {
            showProgress: false,
            suppressErrors: true,
          });
          if (connected) {
            return;
          }
        }
        if (payload.deployed === false) {
          setWalletStatus('authenticated');
        }
      } catch {
        // Best-effort hydrate only.
      }
    };

    void hydratePrivyWallet();

    return () => {
      cancelled = true;
    };
  }, [activeAccount, connectPrivyWallet, externalSession, privy]);

  const logout = useCallback(async () => {
    await clearExternalSession();
    setPrivyWalletAddress(null);
    setWalletError(null);
    setWalletStatus(hasPrivyConfig ? 'idle' : 'unconfigured');

    if (privy?.authenticated) {
      await privy.logout();
    }
  }, [clearExternalSession, privy]);

  const value = useMemo<AuthContextValue>(() => {
    if (externalSession) {
      return {
        authReady: privy?.ready ?? true,
        authConfigured: true,
        privyConfigured: hasPrivyConfig,
        authenticated: true,
        providerKind: externalSession.providerKind,
        account: activeAccount,
        userId: externalSession.userId,
        userName: externalSession.userName,
        userEmail: externalSession.userEmail,
        walletAddress: externalSession.walletAddress,
        walletLabel: externalSession.walletLabel,
        walletSourceLabel: externalSession.walletSourceLabel,
        walletStatus,
        walletDeployed: true,
        walletError,
        canActivateWallet: false,
        availableNativeWallets,
        nativeWalletsLoading,
        nativeWalletPendingId,
        getPrivyAccessToken: async () => null,
        loginWith,
        loginWithCartridge,
        connectNativeWallet,
        refreshNativeWallets,
        activateWallet,
        walletReadyForTransactions: true,
        logout,
      };
    }

    if (privy?.authenticated) {
      return {
        authReady: privy.ready,
        authConfigured: true,
        privyConfigured: true,
        authenticated: true,
        providerKind: 'privy',
        account: activeAccount,
        userId: (privy.user as { id?: string } | null)?.id ?? null,
        userName: resolveUserName(privy.user),
        userEmail: resolveUserEmail(privy.user),
        walletAddress: privyWalletAddress,
        walletLabel: privyWalletAddress
          ? compactAddress(privyWalletAddress)
          : 'Not active yet',
        walletSourceLabel: 'Privy',
        walletStatus,
        walletDeployed,
        walletError,
        canActivateWallet:
          walletStatus !== 'active' && walletDeployed === false && hasStarkzapPrivyResolveUrl,
        availableNativeWallets,
        nativeWalletsLoading,
        nativeWalletPendingId,
        getPrivyAccessToken: async () => privy.getAccessToken(),
        loginWith,
        loginWithCartridge,
        connectNativeWallet,
        refreshNativeWallets,
        activateWallet,
        walletReadyForTransactions: walletStatus === 'active' && Boolean(activeAccount),
        logout,
      };
    }

    return {
      authReady: privy?.ready ?? true,
      authConfigured: true,
      privyConfigured: hasPrivyConfig,
      authenticated: false,
      providerKind: null,
      account: null,
      userId: null,
      userName: 'Piggy Saver',
      userEmail: null,
      walletAddress: null,
      walletLabel: 'Not connected',
      walletSourceLabel: 'No wallet',
      walletStatus: hasPrivyConfig ? walletStatus : 'idle',
      walletDeployed,
      walletError,
      canActivateWallet: false,
      availableNativeWallets,
      nativeWalletsLoading,
      nativeWalletPendingId,
      getPrivyAccessToken: async () => null,
      loginWith,
      loginWithCartridge,
      connectNativeWallet,
      refreshNativeWallets,
      activateWallet,
      walletReadyForTransactions: false,
      logout,
    };
  }, [
    activateWallet,
    availableNativeWallets,
    activeAccount,
    connectNativeWallet,
    externalSession,
    loginWith,
    loginWithCartridge,
    logout,
    nativeWalletsLoading,
    nativeWalletPendingId,
    privy,
    privyWalletAddress,
    refreshNativeWallets,
    walletDeployed,
    walletError,
    walletStatus,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function PrivyRuntimeProvider({ children }: { children: React.ReactNode }) {
  const privy = usePrivy();
  const { signRawHash } = useSignRawHash();

  return (
    <AuthRuntimeProvider
      privy={{
        ready: privy.ready,
        authenticated: privy.authenticated,
        user: privy.user,
        login: privy.login,
        logout: privy.logout,
        getAccessToken: privy.getAccessToken,
        signRawHash,
      }}
    >
      {children}
    </AuthRuntimeProvider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!hasPrivyConfig) {
    return <AuthRuntimeProvider>{children}</AuthRuntimeProvider>;
  }

  return (
    <PrivyProvider
      appId={appEnv.privyAppId}
      clientId={appEnv.privyClientId || undefined}
    >
      <PrivyRuntimeProvider>{children}</PrivyRuntimeProvider>
    </PrivyProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

export { compactAddress };
