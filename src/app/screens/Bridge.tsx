import { useMemo, useState } from 'react';
import { ArrowRightLeft, ExternalLink, Bitcoin, Shield, Gem, Sprout } from 'lucide-react';

type SourceChain = 'ethereum' | 'base' | 'bitcoin';
type TargetAsset = 'safe' | 'bitcoin' | 'eth' | 'grow';

const sourceChains = {
  ethereum: { label: 'Ethereum', assets: ['USDC', 'ETH', 'WBTC'] },
  base: { label: 'Base', assets: ['USDC', 'cbBTC', 'ETH'] },
  bitcoin: { label: 'Bitcoin', assets: ['BTC'] },
} as const;

const targetConfig = {
  safe: { label: 'USDC', icon: Shield, color: '#22D3EE', action: 'Supply on Vesu' },
  bitcoin: { label: 'BTC', icon: Bitcoin, color: '#FBBF24', action: 'Stake natively' },
  eth: { label: 'ETH', icon: Gem, color: '#A78BFA', action: 'Supply on Vesu' },
  grow: { label: 'STRK', icon: Sprout, color: '#34D399', action: 'Stake natively' },
} as const;

function resolveProviderOptions(sourceChain: SourceChain, sourceAsset: string, target: TargetAsset) {
  const destination = targetConfig[target];

  if (sourceChain === 'bitcoin') {
    return {
      summary: `Move ${sourceAsset} from Bitcoin into Starknet, then route it into ${destination.action}.`,
      providers: [
        {
          name: 'Garden',
          role: 'Primary',
          href: 'https://app.garden.finance/',
          note: 'Best first stop for BTC-native bridging into Starknet.',
        },
        {
          name: 'Starknet bridge directory',
          role: 'Fallback',
          href: 'https://www.starknet.io/bridges-and-onramps/',
          note: 'Use this if you want to compare other BTC bridge options.',
        },
      ],
    };
  }

  if (sourceChain === 'base') {
    return {
      summary: `Move ${sourceAsset} from Base into Starknet, then route it into ${destination.action}.`,
      providers: [
        {
          name: 'Layerswap',
          role: 'Primary',
          href: 'https://www.layerswap.io/app',
          note: 'Best fit for Base -> Starknet flow today.',
        },
        {
          name: 'Rhino',
          role: 'Secondary',
          href: 'https://app.rhino.fi/bridge',
          note: 'Useful alternative if Layerswap route is not ideal.',
        },
      ],
    };
  }

  if (sourceAsset === 'USDC' || sourceAsset === 'ETH') {
    return {
      summary: `Move ${sourceAsset} from Ethereum into Starknet, then route it into ${destination.action}.`,
      providers: [
        {
          name: 'StarkGate',
          role: 'Primary',
          href: 'https://starkgate.starknet.io/',
          note: 'Canonical Ethereum -> Starknet route for core assets.',
        },
        {
          name: 'Layerswap',
          role: 'Secondary',
          href: 'https://www.layerswap.io/app',
          note: 'Alternative route if you prefer a faster exchange-style bridge.',
        },
      ],
    };
  }

  return {
    summary: `Move ${sourceAsset} from Ethereum into Starknet, then route it into ${destination.action}.`,
    providers: [
      {
        name: 'Layerswap',
        role: 'Primary',
        href: 'https://www.layerswap.io/app',
        note: 'Best general-purpose route for non-canonical Ethereum assets.',
      },
      {
        name: 'Starknet bridge directory',
        role: 'Fallback',
        href: 'https://www.starknet.io/bridges-and-onramps/',
        note: 'Use this to compare more Starknet bridge options.',
      },
    ],
  };
}

export default function Bridge() {
  const [sourceChain, setSourceChain] = useState<SourceChain>('ethereum');
  const [sourceAsset, setSourceAsset] = useState('USDC');
  const [target, setTarget] = useState<TargetAsset>('safe');

  const targetMeta = targetConfig[target];
  const TargetIcon = targetMeta.icon;
  const recommendation = useMemo(
    () => resolveProviderOptions(sourceChain, sourceAsset, target),
    [sourceAsset, sourceChain, target],
  );

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-white/40 mb-1" style={{ fontSize: 13 }}>
            Cross-chain inflow
          </div>
          <h1 className="text-white" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Bridge
          </h1>
        </div>
        <div
          className="rounded-full px-3 py-1.5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-white/70" style={{ fontSize: 11, fontWeight: 700 }}>
            Live provider routing
          </span>
        </div>
      </div>

      <div
        className="mb-5 rounded-3xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(249,115,22,0.14)', border: '1px solid rgba(249,115,22,0.28)' }}
          >
            <ArrowRightLeft size={18} className="text-orange-400" />
          </div>
          <div>
            <div className="text-white" style={{ fontWeight: 700, fontSize: 15 }}>
              Bring assets into PocketPig
            </div>
            <div className="text-white/40" style={{ fontSize: 12 }}>
              Choose where funds live now, then jump directly to the best Starknet bridge provider.
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-white/55 mb-3" style={{ fontSize: 12, fontWeight: 700 }}>
              Source chain
            </div>
            <div className="space-y-2">
              {(Object.entries(sourceChains) as [SourceChain, (typeof sourceChains)['ethereum']][]).map(([id, entry]) => (
                <button
                  key={id}
                  onClick={() => {
                    setSourceChain(id);
                    setSourceAsset(entry.assets[0]);
                  }}
                  className="w-full rounded-2xl px-3 py-3 text-left"
                  style={{
                    background: sourceChain === id ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${sourceChain === id ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="text-white" style={{ fontWeight: 700, fontSize: 12 }}>
                    {entry.label}
                  </div>
                  <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
                    {entry.assets.join(' · ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-white/55 mb-3" style={{ fontSize: 12, fontWeight: 700 }}>
              Source asset
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sourceChains[sourceChain].assets.map((asset) => (
                <button
                  key={asset}
                  onClick={() => setSourceAsset(asset)}
                  className="rounded-2xl px-3 py-3 text-left"
                  style={{
                    background: sourceAsset === asset ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${sourceAsset === asset ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}`,
                    color: sourceAsset === asset ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-white/55 mb-3" style={{ fontSize: 12, fontWeight: 700 }}>
              Destination
            </div>
            <div className="space-y-2">
              {(Object.entries(targetConfig) as [TargetAsset, (typeof targetConfig)['safe']][]).map(([id, entry]) => {
                const EntryIcon = entry.icon;
                const active = target === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTarget(id)}
                    className="w-full rounded-2xl px-3 py-3 text-left"
                    style={{
                      background: active ? `${entry.color}12` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? `${entry.color}55` : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <EntryIcon size={15} style={{ color: active ? entry.color : 'rgba(255,255,255,0.45)' }} />
                      <span style={{ color: active ? entry.color : 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 12 }}>
                        {entry.label}
                      </span>
                    </div>
                    <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
                      {entry.action}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl p-4"
          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TargetIcon size={15} style={{ color: targetMeta.color }} />
            <div className="text-white" style={{ fontWeight: 700, fontSize: 13 }}>
              Recommended route
            </div>
          </div>
          <div className="text-white/55" style={{ fontSize: 13, lineHeight: 1.7 }}>
            {recommendation.summary}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {recommendation.providers.map((provider) => (
            <div
              key={provider.name}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-white" style={{ fontWeight: 700, fontSize: 14 }}>
                    {provider.name}
                  </div>
                  <div className="text-white/35 mt-1" style={{ fontSize: 11 }}>
                    {provider.role}
                  </div>
                </div>
                <button
                  disabled
                  className="rounded-xl px-3 py-2"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'not-allowed',
                  }}
                >
                  Soon
                </button>
              </div>
              <div className="text-white/45 mt-3" style={{ fontSize: 12, lineHeight: 1.7 }}>
                {provider.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          title="Why this matters"
          body="Bridge is the cleanest growth loop for PocketPig. Funds still outside Starknet can land directly in an earning route."
        />
        <InfoCard
          title="Next step"
          body="Bridge stays on hold for now. StarkZap is still rolling this area out, so PocketPig will keep it in Soon mode until the integration surface is stable."
          href="https://www.starknet.io/bridges-and-onramps/"
        />
      </div>
    </div>
  );
}

function InfoCard({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href?: string;
}) {
  return (
    <div
      className="rounded-3xl p-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-white" style={{ fontWeight: 700, fontSize: 14 }}>
          {title}
        </div>
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className="text-white/45">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      <div className="text-white/45 mt-2" style={{ fontSize: 13, lineHeight: 1.7 }}>
        {body}
      </div>
    </div>
  );
}
