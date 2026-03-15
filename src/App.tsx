import './App.css'
import {
  badgeShelf,
  buildScope,
  dailyLoop,
  guardrails,
  monetizationCards,
  previewStats,
  primaryCta,
  productName,
  productPitch,
  productTagline,
  references,
  savingModes,
  starterGoal,
  techFit,
  xpRules,
} from './lib/starkzap'

function App() {
  return (
    <main className="page-shell">
      <section className="hero-section">
        <div className="hero-copy reveal">
          <div className="eyebrow">Mobile-first Starknet piggy bank</div>
          <h1>{productName}</h1>
          <p className="hero-tagline">{productTagline}</p>
          <p className="hero-body">{productPitch}</p>

          <div className="hero-actions">
            <button className="primary-button" type="button">
              {primaryCta}
            </button>
            <div className="goal-pill">{starterGoal}</div>
          </div>

          <div className="preview-grid">
            {previewStats.map((item) => (
              <article className="mini-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className="phone-shell reveal">
          <div className="phone-top">
            <span>9:41</span>
            <span>streak mode</span>
          </div>

          <div className="piggy-card">
            <div className="piggy-coin">+10 XP</div>
            <div className="piggy-wrap">
              <div className="piggy-ear piggy-ear-left" />
              <div className="piggy-ear piggy-ear-right" />
              <div className="piggy-body">
                <div className="piggy-slot" />
                <div className="piggy-eye" />
                <div className="piggy-snout">
                  <span />
                  <span />
                </div>
                <div className="piggy-leg piggy-leg-left" />
                <div className="piggy-leg piggy-leg-right" />
              </div>
            </div>

            <div className="piggy-stats">
              <div>
                <span>Current mode</span>
                <strong>Grow / STRK</strong>
              </div>
              <div>
                <span>This week</span>
                <strong>5 / 7 feeds</strong>
              </div>
            </div>

            <button className="feed-button" type="button">
              {primaryCta}
            </button>
          </div>

          <div className="bottom-nav">
            <span className="is-active">Home</span>
            <span>Progress</span>
            <span>Profile</span>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <div className="section-heading">
          <div className="eyebrow">Three simple lanes</div>
          <h2>Straightforward saving modes</h2>
        </div>

        <div className="card-grid card-grid-three">
          {savingModes.map((mode) => (
            <article className="content-card" key={mode.title}>
              <span className="chip">{mode.accent}</span>
              <h3>{mode.title}</h3>
              <p>{mode.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-heading">
          <div className="eyebrow">Daily loop</div>
          <h2>One simple action every day</h2>
        </div>

        <div className="card-grid card-grid-three">
          {dailyLoop.map((step) => (
            <article className="content-card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split-section reveal">
        <article className="content-card">
          <div className="section-heading compact">
            <div className="eyebrow">XP economy</div>
            <h2>XP para degil, motivasyon</h2>
          </div>

          <div className="stack-list">
            {xpRules.map((rule) => (
              <div className="row-card" key={rule.title}>
                <strong>{rule.title}</strong>
                <span>{rule.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="section-heading compact">
            <div className="eyebrow">Badge shelf</div>
            <h2>Koleksiyon hissi verir</h2>
          </div>

          <div className="chip-wrap">
            {badgeShelf.map((badge) => (
              <span className="chip subtle" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="section reveal">
        <div className="section-heading">
          <div className="eyebrow">Revenue without clutter</div>
          <h2>Gelir modeli sade kalir</h2>
        </div>

        <div className="card-grid card-grid-three">
          {monetizationCards.map((card) => (
            <article className="content-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split-section reveal">
        <article className="content-card">
          <div className="section-heading compact">
            <div className="eyebrow">Keep it sane</div>
            <h2>Karmasikligi engelleyen kurallar</h2>
          </div>

          <div className="stack-list">
            {guardrails.map((rule) => (
              <div className="row-card" key={rule}>
                <strong>{rule}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="section-heading compact">
            <div className="eyebrow">MVP scope</div>
            <h2>Ilk surum yalnizca 3 ekran</h2>
          </div>

          <div className="stack-list">
            {buildScope.map((item) => (
              <div className="row-card" key={item}>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="section split-section reveal">
        <article className="content-card">
          <div className="section-heading compact">
            <div className="eyebrow">Built on StarkZap</div>
            <h2>Technical foundations are ready</h2>
          </div>

          <div className="stack-list">
            {techFit.map((item) => (
              <div className="row-card" key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="section-heading compact">
            <div className="eyebrow">References</div>
            <h2>Relevant references</h2>
          </div>

          <div className="stack-list">
            {references.map((reference) => (
              <a
                className="row-card reference-row"
                href={reference.href}
                key={reference.href}
                rel="noreferrer"
                target="_blank"
              >
                <div>
                  <strong>{reference.label}</strong>
                  <p>{reference.note}</p>
                </div>
                <span>Open</span>
              </a>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
