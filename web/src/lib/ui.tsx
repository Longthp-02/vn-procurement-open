// Shared UI building blocks used by more than two features (rule of three).
import type { ComponentChildren } from 'preact';
import { Link } from 'wouter-preact';
import { vi } from '../i18n/vi';
import { DataError } from './data';
import { formatCount, formatDate, formatVnd } from './format';
import type { Result } from './useData';
import type { TenderRow } from './types';

export function Loaded<T>({ result, children }: { result: Result<T>; children: (data: T) => ComponentChildren }) {
  if (result.state === 'loading') {
    return (
      <p class="state" role="status">
        {vi.state.loading}
      </p>
    );
  }
  if (result.state === 'error') {
    if (result.error instanceof DataError && result.error.kind === 'not_found') return <NotFound />;
    return (
      <div class="state state-error" role="alert">
        <p>{vi.state.networkError}</p>
        <button type="button" class="btn" onClick={result.retry}>
          {vi.state.retry}
        </button>
      </div>
    );
  }
  return <>{children(result.data)}</>;
}

export function NotFound() {
  return (
    <div class="state">
      <h1 class="state-title">404</h1>
      <p>{vi.state.notFound}</p>
      <Link href="/" class="btn">
        {vi.state.backHome}
      </Link>
    </div>
  );
}

export function Section({ id, title, children, aside }: { id: string; title: string; children: ComponentChildren; aside?: ComponentChildren }) {
  return (
    <section class="section" aria-labelledby={id}>
      <div class="section-head">
        <h2 id={id}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div class="card stat">
      <span class="muted">{label}</span>
      <span class="num stat-value">{value}</span>
      {note && <span class="muted small">{note}</span>}
    </div>
  );
}

/** Horizontal bar; the value is always also shown as text next to it (never color alone). */
export function Bar({ ratio, tone = 'blue' }: { ratio: number | null; tone?: 'blue' | 'orange' }) {
  const pct = Math.max(0, Math.min(1, ratio ?? 0)) * 100;
  return (
    <div class="bar" aria-hidden="true">
      <div class={`bar-fill bar-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TenderCard({ row }: { row: TenderRow }) {
  return (
    <article class="card tender-card">
      <div class="tender-card-main">
        <Link href={`/tender/${row.id}`} class="tender-card-title">
          {row.title}
        </Link>
        <div class="muted small">
          {row.buyer_name} · {formatDate(row.date)}
        </div>
        <ResultLine row={row} />
      </div>
      <div class="tender-card-nums">
        <div>
          <span class="muted xsmall">{vi.tenderCard.priceToAward}</span>
          <span class="num">
            {formatVnd(row.estimate)} → {formatVnd(row.award)}
          </span>
        </div>
        <div>
          <span class="muted xsmall">{vi.tenderCard.bidders}</span>
          <span class="num">{formatCount(row.bidders)}</span>
        </div>
      </div>
    </article>
  );
}

/** What we know about the result. Status decides; a missing winner never means "no result". */
function ResultLine({ row }: { row: TenderRow }) {
  if (row.winner_name) {
    return (
      <div class="small">
        {vi.tenderCard.winner}: <strong>{row.winner_name}</strong>
      </div>
    );
  }
  const text =
    row.status === 'awarded' ? vi.tenderCard.winnerUnknown : row.status === 'cancelled' ? vi.tenderCard.cancelled : vi.tenderCard.notAwarded;
  return <div class="small muted">{text}</div>;
}

export function TenderTable({ rows, labelledBy, showWinner = true }: { rows: TenderRow[]; labelledBy: string; showWinner?: boolean }) {
  return (
    <div class="table-wrap">
      <table aria-labelledby={labelledBy}>
        <thead>
          <tr>
            <th>{vi.cols.tender}</th>
            <th>{showWinner ? vi.cols.winner : vi.cols.buyer}</th>
            <th class="r">{vi.cols.award}</th>
            <th class="r">{vi.cols.bidders}</th>
            <th class="r">{vi.cols.docs}</th>
            <th>{vi.cols.date}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/tender/${r.id}`}>{r.title}</Link>
              </td>
              <td class="muted">{showWinner ? r.winner_name ?? '—' : r.buyer_name}</td>
              <td class="r num">{formatVnd(r.award)}</td>
              <td class="r num">{formatCount(r.bidders)}</td>
              <td class="r num">{r.docs}/7</td>
              <td class="num muted">{formatDate(r.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
