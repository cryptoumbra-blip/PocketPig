# PocketPig

Browser-first Starknet piggy bank prototype powered by `starkzap`.

## What is installed

- `react` + `vite` + `typescript`
- `starkzap@1.0.0`
- `@cartridge/controller@0.13.9`

Install command used locally:

```bash
npm install
npm install starkzap @cartridge/controller
```

## Product direction

The current idea is **PocketPig**: a mobile-first, game-like digital piggy bank where users:

- sign in with social login or passkeys
- pick one simple lane: `USDC`, `Bitcoin`, or `STRK`
- make one small daily savings action
- earn streaks, XP, and badges
- optionally stake directly in the `STRK` lane

Why this direction is stronger:

- it hides DeFi complexity behind a very simple loop
- it works naturally on mobile
- it gives users a reason to return every day
- it avoids building a full token economy or a custom protocol too early

## Current repo state

- `src/App.tsx` now presents PocketPig as a mobile-first product mock.
- `src/lib/starkzap.ts` contains the XP, mode, reward, and MVP structure.
- Mainnet is the default runtime network.

## Known package note

The published `starkzap` package installed successfully, but a direct Node ESM import currently fails because the bundle uses extensionless internal imports. The practical news is better than that error suggests: the Vite browser build passes, so a browser-first integration path is viable right now.

## Run

```bash
npm run dev:all
```

or run them separately:

```bash
npm run server:dev
npm run dev
```

```bash
npm run build
```

## Backend

PocketPig includes a small Node backend for:

- Privy + StarkZap wallet onboarding
- live market overview for STRK / BTC / USDC yield data
- Supabase sync for user state, positions, balances, feeds, XP, and totals

The frontend now supports direct backend URLs through `VITE_API_BASE_URL`, so
it works in both `vite dev` and `vite preview` without relying only on the dev proxy.

Required environment variables:

```bash
VITE_STARKZAP_NETWORK=mainnet
VITE_STARKNET_RPC_URL=https://rpc.starknet.lava.build
VITE_API_BASE_URL=http://localhost:8787
VITE_PRIVY_APP_ID=...
VITE_PRIVY_CLIENT_ID=...
VITE_STARKZAP_PRIVY_RESOLVE_URL=http://localhost:8787/api/privy/starknet/resolve
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
PRIVY_APP_ID=...
PRIVY_APP_SECRET=...
PRIVY_VERIFICATION_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=8787
ALLOWED_ORIGIN=*
```

Supabase schema file:

```bash
supabase/schema.sql
```

Apply that schema in your Supabase SQL editor before enabling sync. It creates
an isolated `pocketpig` schema so it does not collide with other apps using the
same Supabase project.

## Next build steps

1. Add direct Supabase auth or signed server session if you want client-side querying later.
2. Surface live yield history charts instead of current snapshot-only overview.
3. Add richer protocol position breakdowns and per-position PnL.
4. Move XP / missions from local-first logic to durable Supabase-backed progression rules.

## Official references

- [StarkZap site](https://starkzap.io/)
- [Overview docs](https://docs.starknet.io/build/starkzap/overview)
- [Wallet guides](https://docs.starknet.io/build/starkzap/guides/wallets)
- [Paymaster guides](https://docs.starknet.io/build/starkzap/guides/paymasters)
- [Staking guides](https://docs.starknet.io/build/starkzap/guides/staking)
- [NPM package](https://www.npmjs.com/package/starkzap)
