function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function resolveApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const explicitBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (explicitBase) {
    return `${trimTrailingSlash(explicitBase)}${normalizedPath}`;
  }

  return normalizedPath;
}

export const appEnv = {
  starkzapNetwork:
    import.meta.env.VITE_STARKZAP_NETWORK === 'sepolia' ? 'sepolia' : 'mainnet',
  starknetRpcUrl:
    import.meta.env.VITE_STARKNET_RPC_URL?.trim() ??
    (import.meta.env.VITE_STARKZAP_NETWORK === 'sepolia'
      ? 'https://rpc.starknet-sepolia.lava.build'
      : 'https://rpc.starknet.lava.build'),
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID?.trim() ?? '',
  privyClientId: import.meta.env.VITE_PRIVY_CLIENT_ID?.trim() ?? '',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() ?? '',
  starkzapPrivyResolveUrl:
    import.meta.env.VITE_STARKZAP_PRIVY_RESOLVE_URL?.trim() ??
    resolveApiUrl('/api/privy/starknet/resolve'),
  avnuPaymasterApiKey:
    import.meta.env.VITE_AVNU_PAYMASTER_API_KEY?.trim() ?? '',
  avnuPaymasterNodeUrl:
    import.meta.env.VITE_AVNU_PAYMASTER_NODE_URL?.trim() ??
    (import.meta.env.VITE_STARKZAP_NETWORK === 'sepolia'
      ? 'https://sepolia.paymaster.avnu.fi'
      : 'https://starknet.paymaster.avnu.fi'),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '',
  treasuryAddress: import.meta.env.VITE_TREASURY_ADDRESS?.trim() ?? '',
};

export const hasPrivyConfig = Boolean(appEnv.privyAppId);
export const hasStarkzapPrivyResolveUrl = Boolean(
  appEnv.starkzapPrivyResolveUrl,
);
export const hasSupabaseConfig = Boolean(
  appEnv.supabaseUrl && appEnv.supabaseAnonKey,
);
