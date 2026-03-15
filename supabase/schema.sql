create extension if not exists pgcrypto;

create schema if not exists pocketpig;

create or replace function pocketpig.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists pocketpig.users (
  user_key text primary key,
  auth_user_id text,
  wallet_address text,
  provider_kind text,
  display_name text not null,
  email text,
  referral_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pocketpig.user_settings (
  user_key text primary key references pocketpig.users(user_key) on delete cascade,
  mode text not null,
  grow_amount numeric not null default 1,
  eth_amount numeric not null default 0.01,
  bitcoin_amount numeric not null default 0.00000001,
  usdc_amount numeric not null default 25,
  notifications boolean not null default true,
  auto_feed boolean not null default false,
  pig_skin text not null default 'classic',
  updated_at timestamptz not null default now()
);

alter table if exists pocketpig.user_settings
drop column if exists is_premium;

alter table if exists pocketpig.user_settings
add column if not exists eth_amount numeric not null default 0.01;

create table if not exists pocketpig.user_progress (
  user_key text primary key references pocketpig.users(user_key) on delete cascade,
  xp integer not null default 0,
  lifetime_xp integer not null default 0,
  streak integer not null default 0,
  longest_streak integer not null default 0,
  level integer not null default 1,
  total_saved numeric not null default 0,
  fed_today boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table if exists pocketpig.user_progress
add column if not exists lifetime_xp integer not null default 0;

alter table if exists pocketpig.user_progress
add column if not exists longest_streak integer not null default 0;

create table if not exists pocketpig.wallet_balances (
  user_key text not null references pocketpig.users(user_key) on delete cascade,
  wallet_address text,
  asset_symbol text not null,
  amount numeric not null default 0,
  raw_amount text not null default '0',
  updated_at timestamptz not null default now(),
  primary key (user_key, asset_symbol)
);

create table if not exists pocketpig.wallet_positions (
  user_key text not null references pocketpig.users(user_key) on delete cascade,
  wallet_address text,
  position_key text not null,
  protocol text not null,
  mode text not null,
  asset_symbol text not null,
  amount numeric not null default 0,
  rewards numeric,
  unpooling numeric,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_key, position_key)
);

create table if not exists pocketpig.feed_events (
  tx_hash text primary key,
  user_key text not null references pocketpig.users(user_key) on delete cascade,
  wallet_address text,
  feed_date date not null,
  mode text not null,
  source_amount numeric not null default 0,
  xp integer not null default 0,
  asset_symbol text,
  usd_value numeric,
  price_usd numeric,
  fee_bps integer,
  fee_amount_display text,
  fee_amount_usd numeric,
  source_amount_display text,
  target_symbol text,
  target_amount_display text,
  target_amount_usd numeric,
  created_at timestamptz not null default now()
);

create table if not exists pocketpig.dca_orders (
  order_address text primary key,
  user_key text not null references pocketpig.users(user_key) on delete cascade,
  wallet_address text,
  order_id text,
  trader_address text,
  creation_transaction_hash text,
  buy_mode text not null,
  buy_asset_symbol text not null,
  cadence text not null,
  usdc_per_cycle numeric not null default 0,
  iterations integer not null default 0,
  total_budget_usdc numeric not null default 0,
  status text not null default 'INDEXING',
  amount_sold text,
  amount_bought text,
  average_amount_bought text,
  executed_trades_count integer not null default 0,
  pending_trades_count integer not null default 0,
  cancelled_trades_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pocketpig.dca_events (
  tx_hash text primary key,
  user_key text not null references pocketpig.users(user_key) on delete cascade,
  wallet_address text,
  event_date date not null,
  event_type text not null,
  mode text not null,
  asset_symbol text not null,
  cadence text not null,
  usdc_per_cycle numeric not null default 0,
  iterations integer not null default 0,
  usd_value numeric not null default 0,
  xp integer not null default 0,
  order_address text,
  created_at timestamptz not null default now()
);

alter table if exists pocketpig.feed_events
add column if not exists asset_symbol text;

alter table if exists pocketpig.feed_events
add column if not exists usd_value numeric;

alter table if exists pocketpig.feed_events
add column if not exists price_usd numeric;

alter table if exists pocketpig.feed_events
add column if not exists fee_bps integer;

alter table if exists pocketpig.feed_events
add column if not exists fee_amount_display text;

alter table if exists pocketpig.feed_events
add column if not exists fee_amount_usd numeric;

alter table if exists pocketpig.feed_events
add column if not exists event_type text not null default 'feed';

alter table if exists pocketpig.feed_events
add column if not exists protocol text;

alter table if exists pocketpig.feed_events
add column if not exists cadence text;

alter table if exists pocketpig.feed_events
add column if not exists iterations integer;

alter table if exists pocketpig.feed_events
add column if not exists order_address text;

drop trigger if exists users_set_updated_at on pocketpig.users;
create trigger users_set_updated_at
before update on pocketpig.users
for each row execute function pocketpig.set_updated_at();

drop trigger if exists user_settings_set_updated_at on pocketpig.user_settings;
create trigger user_settings_set_updated_at
before update on pocketpig.user_settings
for each row execute function pocketpig.set_updated_at();

drop trigger if exists user_progress_set_updated_at on pocketpig.user_progress;
create trigger user_progress_set_updated_at
before update on pocketpig.user_progress
for each row execute function pocketpig.set_updated_at();

drop trigger if exists wallet_balances_set_updated_at on pocketpig.wallet_balances;
create trigger wallet_balances_set_updated_at
before update on pocketpig.wallet_balances
for each row execute function pocketpig.set_updated_at();

drop trigger if exists wallet_positions_set_updated_at on pocketpig.wallet_positions;
create trigger wallet_positions_set_updated_at
before update on pocketpig.wallet_positions
for each row execute function pocketpig.set_updated_at();

drop view if exists pocketpig.app_stake_totals;

create view pocketpig.app_stake_totals as
select
  coalesce(sum(case when asset_symbol = 'STRK' then amount end), 0)::numeric as total_strk,
  coalesce(sum(case when asset_symbol like '%BTC%' then amount end), 0)::numeric as total_btc,
  coalesce(sum(case when asset_symbol = 'ETH' then amount end), 0)::numeric as total_eth,
  coalesce(sum(case when asset_symbol = 'USDC' then amount end), 0)::numeric as total_usdc,
  max(updated_at) as updated_at
from pocketpig.wallet_positions;

alter table pocketpig.users enable row level security;
alter table pocketpig.user_settings enable row level security;
alter table pocketpig.user_progress enable row level security;
alter table pocketpig.wallet_balances enable row level security;
alter table pocketpig.wallet_positions enable row level security;
alter table pocketpig.feed_events enable row level security;
alter table pocketpig.dca_orders enable row level security;
alter table pocketpig.dca_events enable row level security;

-- PocketPig writes and reads app data through the backend using the Supabase
-- service role key. Add end-user RLS policies later if you want direct client
-- reads from Supabase.

create or replace function public.pocketpig_app_totals()
returns jsonb
language sql
security definer
set search_path = public, pocketpig
as $$
  select jsonb_build_object(
    'total_strk', coalesce(total_strk, 0),
    'total_btc', coalesce(total_btc, 0),
    'total_eth', coalesce(total_eth, 0),
    'total_usdc', coalesce(total_usdc, 0),
    'updated_at', updated_at
  )
  from pocketpig.app_stake_totals;
$$;

create or replace function public.pocketpig_state(p_user_id text default null, p_wallet_address text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pocketpig
as $$
declare
  v_wallet_address text := nullif(lower(trim(coalesce(p_wallet_address, ''))), '');
  v_user_key text := nullif(trim(coalesce(p_user_id, '')), '');
  v_user_record pocketpig.users%rowtype;
  v_settings pocketpig.user_settings%rowtype;
  v_events jsonb;
begin
  if v_user_key is null and v_wallet_address is not null then
    v_user_key := 'wallet:' || v_wallet_address;
  end if;

  if v_user_key is null and v_wallet_address is null then
    return jsonb_build_object('found', false, 'state', null);
  end if;

  if v_user_key is not null then
    select *
    into v_user_record
    from pocketpig.users
    where user_key = v_user_key
    limit 1;
  end if;

  if v_user_record.user_key is null and v_wallet_address is not null then
    select *
    into v_user_record
    from pocketpig.users
    where wallet_address = v_wallet_address
    limit 1;
  end if;

  if v_user_record.user_key is null then
    return jsonb_build_object('found', false, 'state', null);
  end if;

  select *
  into v_settings
  from pocketpig.user_settings
  where user_key = v_user_record.user_key
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', feed_date::text,
        'amount', source_amount,
        'mode', mode,
        'xp', xp,
        'eventType', event_type,
        'protocol', protocol,
        'cadence', cadence,
        'iterations', iterations,
        'orderAddress', order_address,
        'assetSymbol', asset_symbol,
        'usdValue', usd_value,
        'priceUsd', price_usd,
        'feeBps', fee_bps,
        'feeAmountDisplay', fee_amount_display,
        'feeAmountUsd', fee_amount_usd,
        'txHash', tx_hash,
        'targetSymbol', target_symbol,
        'sourceAmountDisplay', source_amount_display,
        'targetAmountDisplay', target_amount_display,
        'targetAmountUsd', target_amount_usd
      )
      order by feed_date asc, created_at asc
    ),
    '[]'::jsonb
  )
  into v_events
  from (
    select *
    from pocketpig.feed_events
    where user_key = v_user_record.user_key
    order by feed_date asc, created_at asc
    limit 100
  ) feed_rows;

  return jsonb_build_object(
    'found', true,
    'state', jsonb_build_object(
      'isOnboarded', true,
      'mode', coalesce(v_settings.mode, 'safe'),
      'dailyAmount', coalesce(v_settings.grow_amount, 1),
      'targetUsdAmount', coalesce(v_settings.usdc_amount, 25),
      'ethAmount', coalesce(v_settings.eth_amount, 0.01),
      'bitcoinAmount', coalesce(v_settings.bitcoin_amount, 0.00000001),
      'notifications', coalesce(v_settings.notifications, true),
      'autoFeed', coalesce(v_settings.auto_feed, false),
      'pigSkin', coalesce(v_settings.pig_skin, 'classic'),
      'referralCode', coalesce(v_user_record.referral_code, 'PP-PIGGYX'),
      'feedEntries', v_events
    )
  );
end;
$$;

create or replace function public.pocketpig_sync(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pocketpig
as $$
declare
  v_user jsonb := coalesce(payload -> 'user', '{}'::jsonb);
  v_settings jsonb := coalesce(payload -> 'settings', '{}'::jsonb);
  v_progress jsonb := coalesce(payload -> 'progress', '{}'::jsonb);
  v_wallet_address text := nullif(trim(coalesce(v_user ->> 'walletAddress', '')), '');
  v_user_id text := nullif(trim(coalesce(v_user ->> 'userId', '')), '');
  v_user_key text := coalesce(v_user_id, case when v_wallet_address is not null then 'wallet:' || lower(v_wallet_address) end);
  balance_item jsonb;
  position_item jsonb;
  event_item jsonb;
begin
  if v_user_key is null then
    raise exception 'userId or walletAddress is required.';
  end if;

  insert into pocketpig.users (
    user_key,
    auth_user_id,
    wallet_address,
    provider_kind,
    display_name,
    email,
    referral_code
  ) values (
    v_user_key,
    v_user_id,
    v_wallet_address,
    nullif(trim(coalesce(v_user ->> 'providerKind', '')), ''),
    coalesce(nullif(trim(coalesce(v_user ->> 'userName', '')), ''), 'Piggy Saver'),
    nullif(trim(coalesce(v_user ->> 'userEmail', '')), ''),
    nullif(trim(coalesce(v_user ->> 'referralCode', '')), '')
  )
  on conflict (user_key) do update set
    auth_user_id = excluded.auth_user_id,
    wallet_address = excluded.wallet_address,
    provider_kind = excluded.provider_kind,
    display_name = excluded.display_name,
    email = excluded.email,
    referral_code = excluded.referral_code;

  insert into pocketpig.user_settings (
    user_key,
    mode,
    grow_amount,
    eth_amount,
    bitcoin_amount,
    usdc_amount,
    notifications,
    auto_feed,
    pig_skin
  ) values (
    v_user_key,
    coalesce(nullif(trim(coalesce(v_settings ->> 'mode', '')), ''), 'safe'),
    coalesce((v_settings ->> 'growAmount')::numeric, 1),
    coalesce((v_settings ->> 'ethAmount')::numeric, 0.01),
    coalesce((v_settings ->> 'bitcoinAmount')::numeric, 0.00000001),
    coalesce((v_settings ->> 'usdcAmount')::numeric, 25),
    coalesce((v_settings ->> 'notifications')::boolean, true),
    coalesce((v_settings ->> 'autoFeed')::boolean, false),
    coalesce(nullif(trim(coalesce(v_settings ->> 'pigSkin', '')), ''), 'classic')
  )
  on conflict (user_key) do update set
    mode = excluded.mode,
    grow_amount = excluded.grow_amount,
    eth_amount = excluded.eth_amount,
    bitcoin_amount = excluded.bitcoin_amount,
    usdc_amount = excluded.usdc_amount,
    notifications = excluded.notifications,
    auto_feed = excluded.auto_feed,
    pig_skin = excluded.pig_skin;

  insert into pocketpig.user_progress (
    user_key,
    xp,
    lifetime_xp,
    streak,
    longest_streak,
    level,
    total_saved,
    fed_today
  ) values (
    v_user_key,
    coalesce((v_progress ->> 'xp')::integer, 0),
    coalesce((v_progress ->> 'lifetimeXp')::integer, coalesce((v_progress ->> 'xp')::integer, 0)),
    coalesce((v_progress ->> 'streak')::integer, 0),
    coalesce((v_progress ->> 'longestStreak')::integer, 0),
    coalesce((v_progress ->> 'level')::integer, 1),
    coalesce((v_progress ->> 'totalSaved')::numeric, 0),
    coalesce((v_progress ->> 'fedToday')::boolean, false)
  )
  on conflict (user_key) do update set
    xp = excluded.xp,
    lifetime_xp = excluded.lifetime_xp,
    streak = excluded.streak,
    longest_streak = excluded.longest_streak,
    level = excluded.level,
    total_saved = excluded.total_saved,
    fed_today = excluded.fed_today;

  for balance_item in
    select value from jsonb_array_elements(coalesce(payload -> 'balances', '[]'::jsonb))
  loop
    insert into pocketpig.wallet_balances (
      user_key,
      wallet_address,
      asset_symbol,
      amount,
      raw_amount
    ) values (
      v_user_key,
      v_wallet_address,
      coalesce(nullif(trim(coalesce(balance_item ->> 'assetSymbol', '')), ''), 'UNKNOWN'),
      coalesce((balance_item ->> 'amount')::numeric, 0),
      coalesce(balance_item ->> 'rawAmount', '0')
    )
    on conflict (user_key, asset_symbol) do update set
      wallet_address = excluded.wallet_address,
      amount = excluded.amount,
      raw_amount = excluded.raw_amount;
  end loop;

  for position_item in
    select value from jsonb_array_elements(coalesce(payload -> 'positions', '[]'::jsonb))
  loop
    insert into pocketpig.wallet_positions (
      user_key,
      wallet_address,
      position_key,
      protocol,
      mode,
      asset_symbol,
      amount,
      rewards,
      unpooling,
      metadata
    ) values (
      v_user_key,
      v_wallet_address,
      coalesce(nullif(trim(coalesce(position_item ->> 'positionKey', '')), ''), gen_random_uuid()::text),
      coalesce(nullif(trim(coalesce(position_item ->> 'protocol', '')), ''), 'unknown'),
      coalesce(nullif(trim(coalesce(position_item ->> 'mode', '')), ''), 'safe'),
      coalesce(nullif(trim(coalesce(position_item ->> 'assetSymbol', '')), ''), 'UNKNOWN'),
      coalesce((position_item ->> 'amount')::numeric, 0),
      case when position_item ->> 'rewards' is null then null else (position_item ->> 'rewards')::numeric end,
      case when position_item ->> 'unpooling' is null then null else (position_item ->> 'unpooling')::numeric end,
      coalesce(position_item -> 'metadata', '{}'::jsonb)
    )
    on conflict (user_key, position_key) do update set
      wallet_address = excluded.wallet_address,
      protocol = excluded.protocol,
      mode = excluded.mode,
      asset_symbol = excluded.asset_symbol,
      amount = excluded.amount,
      rewards = excluded.rewards,
      unpooling = excluded.unpooling,
      metadata = excluded.metadata;
  end loop;

  for event_item in
    select value from jsonb_array_elements(coalesce(payload -> 'feedEvents', '[]'::jsonb))
  loop
    if nullif(trim(coalesce(event_item ->> 'txHash', '')), '') is not null then
      insert into pocketpig.feed_events (
        tx_hash,
        user_key,
        wallet_address,
        feed_date,
        mode,
        source_amount,
        xp,
        event_type,
        protocol,
        cadence,
        iterations,
        order_address,
        asset_symbol,
        usd_value,
        price_usd,
        fee_bps,
        fee_amount_display,
        fee_amount_usd,
        source_amount_display,
        target_symbol,
        target_amount_display,
        target_amount_usd
      ) values (
        event_item ->> 'txHash',
        v_user_key,
        v_wallet_address,
        coalesce((event_item ->> 'date')::date, current_date),
        coalesce(nullif(trim(coalesce(event_item ->> 'mode', '')), ''), 'safe'),
        coalesce((event_item ->> 'amount')::numeric, 0),
        coalesce((event_item ->> 'xp')::integer, 0),
        coalesce(nullif(trim(coalesce(event_item ->> 'eventType', '')), ''), 'feed'),
        nullif(trim(coalesce(event_item ->> 'protocol', '')), ''),
        nullif(trim(coalesce(event_item ->> 'cadence', '')), ''),
        case when event_item ->> 'iterations' is null then null else (event_item ->> 'iterations')::integer end,
        nullif(trim(coalesce(event_item ->> 'orderAddress', '')), ''),
        nullif(trim(coalesce(event_item ->> 'assetSymbol', '')), ''),
        case when event_item ->> 'usdValue' is null then null else (event_item ->> 'usdValue')::numeric end,
        case when event_item ->> 'priceUsd' is null then null else (event_item ->> 'priceUsd')::numeric end,
        case when event_item ->> 'feeBps' is null then null else (event_item ->> 'feeBps')::integer end,
        nullif(trim(coalesce(event_item ->> 'feeAmountDisplay', '')), ''),
        case when event_item ->> 'feeAmountUsd' is null then null else (event_item ->> 'feeAmountUsd')::numeric end,
        nullif(trim(coalesce(event_item ->> 'sourceAmountDisplay', '')), ''),
        nullif(trim(coalesce(event_item ->> 'targetSymbol', '')), ''),
        nullif(trim(coalesce(event_item ->> 'targetAmountDisplay', '')), ''),
        case when event_item ->> 'targetAmountUsd' is null then null else (event_item ->> 'targetAmountUsd')::numeric end
      )
      on conflict (tx_hash) do update set
        user_key = excluded.user_key,
        wallet_address = excluded.wallet_address,
        feed_date = excluded.feed_date,
        mode = excluded.mode,
        source_amount = excluded.source_amount,
        xp = excluded.xp,
        event_type = excluded.event_type,
        protocol = excluded.protocol,
        cadence = excluded.cadence,
        iterations = excluded.iterations,
        order_address = excluded.order_address,
        asset_symbol = excluded.asset_symbol,
        usd_value = excluded.usd_value,
        price_usd = excluded.price_usd,
        fee_bps = excluded.fee_bps,
        fee_amount_display = excluded.fee_amount_display,
        fee_amount_usd = excluded.fee_amount_usd,
        source_amount_display = excluded.source_amount_display,
        target_symbol = excluded.target_symbol,
        target_amount_display = excluded.target_amount_display,
        target_amount_usd = excluded.target_amount_usd;
    end if;
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.pocketpig_app_totals() to anon, authenticated, service_role;
grant execute on function public.pocketpig_state(text, text) to anon, authenticated, service_role;
grant execute on function public.pocketpig_sync(jsonb) to anon, authenticated, service_role;

create or replace function public.pocketpig_sync_dca(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pocketpig
as $$
declare
  v_user jsonb := coalesce(payload -> 'user', '{}'::jsonb);
  v_wallet_address text := nullif(lower(trim(coalesce(v_user ->> 'walletAddress', ''))), '');
  v_user_id text := nullif(trim(coalesce(v_user ->> 'userId', '')), '');
  v_user_key text := coalesce(v_user_id, case when v_wallet_address is not null then 'wallet:' || v_wallet_address end);
  order_item jsonb;
  event_item jsonb;
begin
  if v_user_key is null then
    raise exception 'userId or walletAddress is required.';
  end if;

  insert into pocketpig.users (
    user_key,
    auth_user_id,
    wallet_address,
    display_name
  ) values (
    v_user_key,
    v_user_id,
    v_wallet_address,
    'Piggy Saver'
  )
  on conflict (user_key) do update set
    auth_user_id = coalesce(excluded.auth_user_id, pocketpig.users.auth_user_id),
    wallet_address = coalesce(excluded.wallet_address, pocketpig.users.wallet_address);

  for order_item in
    select value from jsonb_array_elements(coalesce(payload -> 'orders', '[]'::jsonb))
  loop
    insert into pocketpig.dca_orders (
      order_address,
      user_key,
      wallet_address,
      order_id,
      trader_address,
      creation_transaction_hash,
      buy_mode,
      buy_asset_symbol,
      cadence,
      usdc_per_cycle,
      iterations,
      total_budget_usdc,
      status,
      amount_sold,
      amount_bought,
      average_amount_bought,
      executed_trades_count,
      pending_trades_count,
      cancelled_trades_count,
      metadata
    ) values (
      coalesce(nullif(trim(coalesce(order_item ->> 'orderAddress', '')), ''), gen_random_uuid()::text),
      v_user_key,
      v_wallet_address,
      nullif(trim(coalesce(order_item ->> 'orderId', '')), ''),
      nullif(trim(coalesce(order_item ->> 'traderAddress', '')), ''),
      nullif(trim(coalesce(order_item ->> 'creationTransactionHash', '')), ''),
      coalesce(nullif(trim(coalesce(order_item ->> 'buyMode', '')), ''), 'grow'),
      coalesce(nullif(trim(coalesce(order_item ->> 'buyAssetSymbol', '')), ''), 'STRK'),
      coalesce(nullif(trim(coalesce(order_item ->> 'cadence', '')), ''), 'weekly'),
      coalesce((order_item ->> 'usdcPerCycle')::numeric, 0),
      coalesce((order_item ->> 'iterations')::integer, 0),
      coalesce((order_item ->> 'totalBudgetUsdc')::numeric, 0),
      coalesce(nullif(trim(coalesce(order_item ->> 'status', '')), ''), 'INDEXING'),
      nullif(trim(coalesce(order_item ->> 'amountSold', '')), ''),
      nullif(trim(coalesce(order_item ->> 'amountBought', '')), ''),
      nullif(trim(coalesce(order_item ->> 'averageAmountBought', '')), ''),
      coalesce((order_item ->> 'executedTradesCount')::integer, 0),
      coalesce((order_item ->> 'pendingTradesCount')::integer, 0),
      coalesce((order_item ->> 'cancelledTradesCount')::integer, 0),
      coalesce(order_item -> 'metadata', '{}'::jsonb)
    )
    on conflict (order_address) do update set
      user_key = excluded.user_key,
      wallet_address = excluded.wallet_address,
      order_id = excluded.order_id,
      trader_address = excluded.trader_address,
      creation_transaction_hash = excluded.creation_transaction_hash,
      buy_mode = excluded.buy_mode,
      buy_asset_symbol = excluded.buy_asset_symbol,
      cadence = excluded.cadence,
      usdc_per_cycle = excluded.usdc_per_cycle,
      iterations = excluded.iterations,
      total_budget_usdc = excluded.total_budget_usdc,
      status = excluded.status,
      amount_sold = excluded.amount_sold,
      amount_bought = excluded.amount_bought,
      average_amount_bought = excluded.average_amount_bought,
      executed_trades_count = excluded.executed_trades_count,
      pending_trades_count = excluded.pending_trades_count,
      cancelled_trades_count = excluded.cancelled_trades_count,
      metadata = excluded.metadata;
  end loop;

  for event_item in
    select value from jsonb_array_elements(coalesce(payload -> 'events', '[]'::jsonb))
  loop
    insert into pocketpig.dca_events (
      tx_hash,
      user_key,
      wallet_address,
      event_date,
      event_type,
      mode,
      asset_symbol,
      cadence,
      usdc_per_cycle,
      iterations,
      usd_value,
      xp,
      order_address
    ) values (
      event_item ->> 'txHash',
      v_user_key,
      v_wallet_address,
      coalesce((event_item ->> 'eventDate')::date, current_date),
      coalesce(nullif(trim(coalesce(event_item ->> 'eventType', '')), ''), 'create'),
      coalesce(nullif(trim(coalesce(event_item ->> 'mode', '')), ''), 'grow'),
      coalesce(nullif(trim(coalesce(event_item ->> 'assetSymbol', '')), ''), 'STRK'),
      coalesce(nullif(trim(coalesce(event_item ->> 'cadence', '')), ''), 'weekly'),
      coalesce((event_item ->> 'usdcPerCycle')::numeric, 0),
      coalesce((event_item ->> 'iterations')::integer, 0),
      coalesce((event_item ->> 'usdValue')::numeric, 0),
      coalesce((event_item ->> 'xp')::integer, 0),
      nullif(trim(coalesce(event_item ->> 'orderAddress', '')), '')
    )
    on conflict (tx_hash) do update set
      user_key = excluded.user_key,
      wallet_address = excluded.wallet_address,
      event_date = excluded.event_date,
      event_type = excluded.event_type,
      mode = excluded.mode,
      asset_symbol = excluded.asset_symbol,
      cadence = excluded.cadence,
      usdc_per_cycle = excluded.usdc_per_cycle,
      iterations = excluded.iterations,
      usd_value = excluded.usd_value,
      xp = excluded.xp,
      order_address = excluded.order_address;
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.pocketpig_sync_dca(jsonb) to anon, authenticated, service_role;

create or replace function public.pocketpig_weekly_leaderboard(
  p_user_id text default null,
  p_wallet_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pocketpig
as $$
declare
  v_wallet_address text := nullif(lower(trim(coalesce(p_wallet_address, ''))), '');
  v_user_key text := nullif(trim(coalesce(p_user_id, '')), '');
  v_entries jsonb;
begin
  if v_user_key is null and v_wallet_address is not null then
    v_user_key := 'wallet:' || v_wallet_address;
  end if;

  with weekly_totals as (
    select
      u.user_key,
      coalesce(nullif(u.display_name, ''), 'Piggy Saver') as display_name,
      u.wallet_address,
      coalesce(sum(fe.xp), 0)::int as weekly_xp
    from pocketpig.users u
    left join pocketpig.feed_events fe
      on fe.user_key = u.user_key
     and fe.feed_date >= current_date - 6
    group by u.user_key, u.display_name, u.wallet_address
  ),
  ranked as (
    select
      user_key,
      display_name,
      wallet_address,
      weekly_xp,
      dense_rank() over (order by weekly_xp desc, display_name asc) as rank
    from weekly_totals
    where weekly_xp > 0
  ),
  top_rows as (
    select *
    from ranked
    order by rank asc, display_name asc
    limit 10
  ),
  current_row as (
    select *
    from ranked
    where user_key = v_user_key
       or (v_wallet_address is not null and lower(coalesce(wallet_address, '')) = v_wallet_address)
    limit 1
  ),
  combined as (
    select * from top_rows
    union
    select *
    from current_row
    where not exists (select 1 from top_rows where top_rows.user_key = current_row.user_key)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'rank', rank,
        'name', display_name,
        'xp', weekly_xp,
        'you',
          case
            when v_user_key is not null and user_key = v_user_key then true
            when v_wallet_address is not null and lower(coalesce(wallet_address, '')) = v_wallet_address then true
            else false
          end
      )
      order by rank asc, name asc
    ),
    '[]'::jsonb
  )
  into v_entries
  from combined;

  return jsonb_build_object('entries', v_entries);
end;
$$;

grant execute on function public.pocketpig_weekly_leaderboard(text, text) to anon, authenticated, service_role;
