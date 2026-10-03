import { Link } from 'wouter-preact';
import { vi } from '../../i18n/vi';
import { formatCount, formatPercent, formatVnd } from '../../lib/format';
import { Bar, Loaded, Section, Stat, TenderTable } from '../../lib/ui';
import { useData, useTitle } from '../../lib/useData';
import type { Contractor } from '../../lib/types';

const t = vi.contractor;

export function ContractorPage({ id }: { id: string }) {
  const result = useData((ds) => ds.contractor(id), `contractor:${id}`);
  useTitle(result.state === 'ok' ? `${result.data.name} · ${vi.site.name}` : null);
  return (
    <div class="container page">
      <Loaded result={result}>{(c) => <ContractorView c={c} />}</Loaded>
    </div>
  );
}

function ContractorView({ c }: { c: Contractor }) {
  const maxYear = Math.max(1, ...c.by_year.map((y) => y.value_vnd));
  return (
    <div class="stack-xl">
      <div class="stack">
        <nav aria-label="breadcrumb" class="muted small">
          <Link href="/contractors">{t.title}</Link> / {c.tax_code}
        </nav>
        <h1>{c.name}</h1>
        <div class="muted">
          {t.tax} <span class="num">{c.tax_code}</span>
          {c.provinces.length > 0 && ` · ${c.provinces.join(', ')}`}
        </div>
      </div>
      <p class="card card-quiet small">{t.neutral}</p>

      <div class="grid-cards">
        <Stat label={t.wins} value={formatCount(c.wins)} />
        <Stat label={t.bids} value={formatCount(c.bids)} />
        <Stat label={t.value} value={formatVnd(c.award_value_vnd)} />
        <Stat label={t.buyers} value={formatCount(c.buyers)} />
      </div>

      <div class="grid-2">
        <Section id="theo-nam" title={t.byYear}>
          <ul class="card bars">
            {c.by_year.map((y) => (
              <li key={y.year} class="bar-line">
                <span class="bar-label">{y.year}</span>
                <Bar ratio={y.value_vnd / maxYear} />
                <span class="num bar-value">{formatVnd(y.value_vnd)}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section id="ben-moi-thau" title={t.topBuyers}>
          <ul class="card bars">
            {c.top_buyers.map((b) => (
              <li key={b.id} class="stack-sm">
                <div class="spread">
                  <Link href={`/buyer/${b.id}`}>{b.name}</Link>
                  <span class="num muted">
                    {b.count} gói · {formatPercent(b.share)}
                  </span>
                </div>
                <Bar ratio={b.share} tone="orange" />
              </li>
            ))}
          </ul>
          <p class="muted small">{t.shareNote}</p>
        </Section>
      </div>

      <Section id="goi-da-trung" title={t.winsList}>
        {c.recent_wins.length ? <TenderTable rows={c.recent_wins} labelledBy="goi-da-trung" showWinner={false} /> : <p class="muted">{t.noWins}</p>}
      </Section>
    </div>
  );
}
