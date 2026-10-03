import { useState } from 'preact/hooks';
import { Link, useLocation, useSearch } from 'wouter-preact';
import { vi } from '../../i18n/vi';
import { formatCount } from '../../lib/format';
import { filterTenders } from '../../lib/search';
import { Loaded, TenderCard } from '../../lib/ui';
import { useData, useTitle } from '../../lib/useData';
import type { ProvinceRow, Status, TenderRow } from '../../lib/types';

const PAGE_SIZE = 20;
const t = vi.list;

export function TendersPage() {
  useTitle(`${t.title} · ${vi.site.name}`);
  const result = useData((ds) => Promise.all([ds.tenders(), ds.provinces()]), 'tenders');
  const params = new URLSearchParams(useSearch());
  return (
    <div class="container page stack-lg">
      <h1>{t.title}</h1>
      <Loaded result={result}>{([rows, provinces]) => <Results rows={rows} provinces={provinces} params={params} />}</Loaded>
    </div>
  );
}

function Results({ rows, provinces, params }: { rows: TenderRow[]; provinces: ProvinceRow[]; params: URLSearchParams }) {
  const [, navigate] = useLocation();
  const q = params.get('q') ?? '';
  const province = params.get('province') ?? '';
  const status = (params.get('status') ?? '') as Status | '';

  const matches = filterTenders(rows, { q, province, status });
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(params.get('page')) || 1));
  const shown = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const go = (over: Record<string, string>) => {
    const next = new URLSearchParams({ q, province, status, ...over });
    for (const [k, v] of [...next]) if (!v || (k === 'page' && v === '1')) next.delete(k);
    navigate(`/tenders?${next.toString()}`);
  };

  return (
    <>
      <Filters key={`${q}|${province}|${status}`} q={q} province={province} status={status} provinces={provinces} onApply={(f) => go({ ...f, page: '1' })} />
      <p class="strong" aria-live="polite">
        {t.results(formatCount(matches.length))}
      </p>
      {shown.length === 0 ? (
        <p class="state">{vi.state.noResults}</p>
      ) : (
        <div class="stack">
          {shown.map((r) => (
            <TenderCard key={r.id} row={r} />
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav class="pager" aria-label={t.page(page, pages)}>
          {page > 1 ? <Link href={pageHref(params, page - 1)}>{t.prev}</Link> : <span />}
          <span class="muted">{t.page(page, pages)}</span>
          {page < pages ? <Link href={pageHref(params, page + 1)}>{t.next}</Link> : <span />}
        </nav>
      )}
    </>
  );
}

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set('page', String(page));
  return `/tenders?${next.toString()}`;
}

type FilterValues = { q: string; province: string; status: string };

function Filters(props: FilterValues & { provinces: ProvinceRow[]; onApply: (f: FilterValues) => void }) {
  const [f, setF] = useState<FilterValues>({ q: props.q, province: props.province, status: props.status });
  const set = (k: keyof FilterValues) => (e: Event) => setF({ ...f, [k]: (e.target as HTMLInputElement).value });
  return (
    <form
      role="search"
      class="card filters"
      onSubmit={(e) => {
        e.preventDefault();
        props.onApply(f);
      }}
    >
      <label class="search-q">
        {vi.home.searchLabel}
        <input type="search" value={f.q} placeholder={vi.home.searchPlaceholder} onInput={set('q')} />
      </label>
      <label>
        {vi.home.provinceLabel}
        <select value={f.province} onChange={set('province')}>
          <option value="">{vi.home.allProvinces}</option>
          {props.provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.status}
        <select value={f.status} onChange={set('status')}>
          <option value="">{t.statusAll}</option>
          {Object.entries(vi.status).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" class="btn">
        {vi.home.searchButton}
      </button>
    </form>
  );
}
