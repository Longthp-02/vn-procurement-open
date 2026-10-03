import { Link } from 'wouter-preact';
import { vi } from '../../i18n/vi';
import { formatCount, formatPercent, formatVnd } from '../../lib/format';
import { Bar, Loaded, Section, Stat, TenderTable } from '../../lib/ui';
import { useData, useTitle } from '../../lib/useData';
import { DOC_KEYS, type Buyer, type Meta } from '../../lib/types';

const t = vi.buyer;

export function BuyerPage({ id }: { id: string }) {
  const result = useData((ds) => Promise.all([ds.buyer(id), ds.meta()]), `buyer:${id}`);
  useTitle(result.state === 'ok' ? `${result.data[0].name} · ${vi.site.name}` : null);
  return (
    <div class="container page">
      <Loaded result={result}>{([b, meta]) => <BuyerView b={b} meta={meta} />}</Loaded>
    </div>
  );
}

function BuyerView({ b, meta }: { b: Buyer; meta: Meta }) {
  return (
    <div class="stack-xl">
      <div class="stack">
        <nav aria-label="breadcrumb" class="muted small">
          <Link href="/buyers">{t.title}</Link> / {b.province.name}
        </nav>
        <h1>{b.name}</h1>
        <div class="muted">
          {b.province.name} · {t.since(b.since)}
        </div>
      </div>

      <div class="grid-cards">
        <Stat label={t.tenders} value={formatCount(b.tenders)} />
        <Stat label={t.value} value={formatVnd(b.award_value_vnd)} />
        <Stat label={t.single} value={formatPercent(b.single_bidder_share.value)} note={t.vsNational(formatPercent(meta.national.single_bidder_share.value))} />
        <Stat label={t.disclosure} value={formatPercent(b.disclosure.value)} note={t.vsNational(formatPercent(meta.national.disclosure.value))} />
      </div>

      <div class="grid-2">
        <Section id="cong-khai-tai-lieu" title={t.docsTitle}>
          <div class="card stack">
            <p class="muted small">{t.docsText}</p>
            <ul class="bars">
              {DOC_KEYS.map((k) => (
                <li key={k} class="stack-sm">
                  <div class="spread">
                    <span>{vi.docs[k]}</span>
                    <span class="num">{formatPercent(b.documents[k].value)}</span>
                  </div>
                  <Bar ratio={b.documents[k].value} />
                </li>
              ))}
            </ul>
          </div>
        </Section>
        <Section id="nha-thau-hang-dau" title={t.topContractors}>
          <ul class="card bars">
            {b.top_contractors.map((c) => (
              <li key={c.id} class="stack-sm">
                <div class="spread">
                  <Link href={`/contractor/${c.id}`}>{c.name}</Link>
                  <span class="num muted">
                    {c.count} gói · {formatPercent(c.share)}
                  </span>
                </div>
                <Bar ratio={c.share} tone="orange" />
              </li>
            ))}
          </ul>
          <p class="muted small">{t.shareNote}</p>
        </Section>
      </div>

      <Section id="goi-gan-day" title={t.recent}>
        <TenderTable rows={b.recent} labelledBy="goi-gan-day" />
      </Section>
    </div>
  );
}
