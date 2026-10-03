import { Link } from 'wouter-preact';
import { vi } from '../../i18n/vi';
import { officialSourceUrl, reportIssueUrl } from '../../lib/config';
import { formatCount, formatDate, formatDays, formatPercent, formatVnd } from '../../lib/format';
import { Loaded, Section } from '../../lib/ui';
import { useData, useTitle } from '../../lib/useData';
import { DOC_KEYS, type Tender } from '../../lib/types';

const t = vi.tender;

export function TenderPage({ id }: { id: string }) {
  const result = useData((ds) => Promise.all([ds.tender(id), ds.meta()]), `tender:${id}`);
  useTitle(result.state === 'ok' ? `${result.data[0].title} · ${vi.site.name}` : null);
  return (
    <div class="container page">
      <Loaded result={result}>{([tender, meta]) => <TenderView tender={tender} isSample={meta.is_sample} />}</Loaded>
    </div>
  );
}

function TenderView({ tender, isSample }: { tender: Tender; isSample: boolean }) {
  const sourceUrl = officialSourceUrl(tender.source_url);
  const winner = tender.bids?.find((b) => b.won)?.contractor ?? null;
  const published = DOC_KEYS.filter((k) => tender.documents[k]).length;
  const savings = tender.derived.savings;
  const sector = tender.context.sector;

  return (
    <div class="stack-xl">
      <div class="stack">
        <nav aria-label="breadcrumb" class="muted small">
          <Link href="/tenders">{vi.nav.tenders}</Link> / {tender.province.name} / {tender.id}
        </nav>
        <h1>{tender.title}</h1>
        <div class="chips">
          <span class="chip">{vi.sector[tender.sector] ?? tender.sector}</span>
          <span class="chip">{vi.method[tender.method] ?? tender.method}</span>
          {tender.funding && <span class="chip">{tender.funding}</span>}
          <span class={`chip ${tender.status === 'awarded' ? 'chip-ok' : ''}`}>{vi.status[tender.status]}</span>
        </div>
      </div>

      <div class="split">
        <div class="stack-lg split-main">
          <Section id="so-lieu" title={t.keyNumbers}>
            <div class="card">
              <div class="grid-4">
                <Num label={t.estimate} value={formatVnd(tender.estimate_vnd)} />
                <Num label={t.award} value={formatVnd(tender.award_vnd)} />
                <Num label={t.difference} value={savings === null ? '—' : formatPercent(-savings, { signed: true })} />
                <Num label={t.bidders} value={formatCount(tender.derived.bidders)} />
              </div>
            </div>
          </Section>

          <Section id="chi-so" title={t.indicatorsTitle} aside={<Link href="/methodology">{vi.home.howCalculated}</Link>}>
            <div class="card stack">
              <Indicator label={t.indBidders} why={t.indBiddersWhy} value={formatCount(tender.derived.bidders)} avg={formatCount(sector.avg_bidders.value, 1)} />
              <Indicator label={t.indSavings} why={t.indSavingsWhy} value={formatPercent(savings)} avg={formatPercent(sector.avg_savings.value)} />
              <Indicator label={t.indDays} why={t.indDaysWhy} value={formatDays(tender.derived.days)} avg={formatDays(sector.median_days.value)} />
            </div>
          </Section>

          <Section id="cong-khai" title={t.disclosureTitle} aside={<span class="num strong">{t.docsCount(published)}</span>}>
            <div class="card stack">
              <p class="muted small">{t.disclosureText}</p>
              <ul class="doc-list">
                {DOC_KEYS.map((k) => (
                  <li key={k} class={tender.documents[k] ? 'doc-ok' : 'doc-missing'}>
                    <span class="doc-icon" aria-hidden="true">{tender.documents[k] ? '✓' : '–'}</span>
                    <span>
                      {vi.docs[k]}
                      {!tender.documents[k] && <span class="muted small"> ({t.notPublished})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section id="nha-thau" title={t.biddersTitle}>
            {tender.bids === null ? (
              <p class="card muted">{t.biddersUnknown}</p>
            ) : (
              <div class="table-wrap">
                <table aria-labelledby="nha-thau">
                  <thead>
                    <tr>
                      <th>{t.colContractor}</th>
                      <th>{t.colTax}</th>
                      <th class="r">{t.colBid}</th>
                      <th>{t.colResult}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tender.bids.map((b) => (
                      <tr key={b.contractor.id}>
                        <td>
                          <Link href={`/contractor/${b.contractor.id}`}>{b.contractor.name}</Link>
                        </td>
                        <td class="num">{b.contractor.tax_code}</td>
                        <td class="r num">{formatVnd(b.amount_vnd)}</td>
                        <td>{b.won ? <span class="chip chip-ok">{t.won}</span> : <span class="muted">{t.lost}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section id="tien-trinh" title={t.timelineTitle}>
            <ol class="timeline">
              {(['plan', 'notice', 'opening', 'award'] as const).map((k) => (
                <li key={k} class={tender.dates[k] ? '' : 'muted'}>
                  <span class="strong">{t.timeline[k]}</span>
                  <span class="num">{formatDate(tender.dates[k])}</span>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <aside class="stack split-side">
          <div class="card stack-sm">
            <span class="muted small">{t.buyerBox}</span>
            <span class="strong">{tender.buyer.name}</span>
            <span class="small">{t.buyerStats(tender.context.buyer_tenders, tender.context.buyer_since)}</span>
            <Link href={`/buyer/${tender.buyer.id}`} class="strong small">
              {t.buyerLink}
            </Link>
          </div>
          {winner && (
            <div class="card stack-sm">
              <span class="muted small">{t.winnerBox}</span>
              <span class="strong">{winner.name}</span>
              {tender.context.winner_wins_with_buyer !== null && <span class="small">{t.winnerStats(tender.context.winner_wins_with_buyer)}</span>}
              <Link href={`/contractor/${winner.id}`} class="strong small">
                {t.winnerLink}
              </Link>
            </div>
          )}
          <div class="card card-quiet stack-sm small">
            <span class="strong">{t.sourceTitle}</span>
            <span>{t.notice(tender.id)}</span>
            <span>{t.collected(formatDate(tender.collected_at))}</span>
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" class="strong">
                {t.sourceOpen}
              </a>
            ) : (
              <span class="muted">{isSample ? t.sourceSample : t.sourceMissing}</span>
            )}
            <a href={reportIssueUrl(tender.id)} target="_blank" rel="noopener noreferrer">
              {vi.site.reportError}
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Num({ label, value }: { label: string; value: string }) {
  return (
    <div class="stack-sm">
      <span class="muted small">{label}</span>
      <span class="num stat-value">{value}</span>
    </div>
  );
}

function Indicator({ label, why, value, avg }: { label: string; why: string; value: string; avg: string }) {
  return (
    <div class="indicator">
      <div class="stack-sm">
        <span class="strong">{label}</span>
        <span class="muted small">{why}</span>
      </div>
      <div class="indicator-nums">
        <div>
          <span class="muted xsmall">{t.thisTender}</span>
          <span class="num big">{value}</span>
        </div>
        <div>
          <span class="muted xsmall">{t.sectorAvg}</span>
          <span class="num big muted">{avg}</span>
        </div>
      </div>
    </div>
  );
}
