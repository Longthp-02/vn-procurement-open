import { useState } from 'preact/hooks';
import { Link, useLocation } from 'wouter-preact';
import { vi } from '../../i18n/vi';
import { asset } from '../../lib/config';
import { formatCount, formatPercent, formatVnd } from '../../lib/format';
import { topicInfo } from '../../lib/topics';
import { Bar, Loaded, Section, Stat, TenderCard } from '../../lib/ui';
import { useData, useTitle } from '../../lib/useData';
import type { ProvinceRow } from '../../lib/types';

const t = vi.home;
const LATEST = 5;

export function HomePage() {
  useTitle(vi.site.name);
  const result = useData(
    (ds) => Promise.all([ds.meta(), ds.provinces(), ds.topics(), ds.latest()]),
    'home',
  );
  return (
    <Loaded result={result}>
      {([meta, provinces, topics, latest]) => (
        <>
          <Hero provinces={provinces} />
          <div class="container stack-xl page">
            <Section id="tong-quan" title={t.overview}>
              <div class="grid-cards">
                <Stat label={t.statAwarded} value={formatCount(meta.national.awarded)} note={meta.years ? `${meta.years[0]}–${meta.years[1]}` : undefined} />
                <Stat label={t.statValue} value={formatVnd(meta.national.award_value_vnd)} />
                <Stat label={t.statSingle} value={formatPercent(meta.national.single_bidder_share.value)} note={t.basedOn(formatCount(meta.national.single_bidder_share.n))} />
                <Stat label={t.statSavings} value={formatPercent(meta.national.avg_savings.value)} note={t.basedOn(formatCount(meta.national.avg_savings.n))} />
              </div>
            </Section>

            <Section id="tinh-thanh" title={t.provincesTitle} aside={<Link href="/methodology">{t.howCalculated}</Link>}>
              <ProvinceTable rows={provinces} />
              <p class="muted small">{t.disclosureNote}</p>
            </Section>

            <Section id="chuyen-de" title={t.topicsTitle}>
              <div class="grid-cards">
                {topics.map((tp) => (
                  <Link key={tp.id} href={`/topic/${tp.id}`} class="card topic-card">
                    <span class="topic-name">{topicInfo(tp.id).name}</span>
                    <span class="muted small">{topicInfo(tp.id).desc}</span>
                    <span class="num muted small">
                      {vi.packages(formatCount(tp.tenders))} · {formatVnd(tp.award_value_vnd)}
                    </span>
                  </Link>
                ))}
              </div>
            </Section>

            <Section id="moi-nhat" title={t.latestTitle}>
              <div class="stack">
                {latest.slice(0, LATEST).map((r) => (
                  <TenderCard key={r.id} row={r} />
                ))}
              </div>
              <Link href="/tenders" class="strong">
                {t.seeAll}
              </Link>
            </Section>

            <div class="grid-2">
              <div class="card stack" id="du-lieu-mo">
                <h2>{t.openDataTitle}</h2>
                <p class="muted">{t.openDataText}</p>
                <div class="row-wrap">
                  <a class="btn" href={asset('data/download/tenders.csv')} download>
                    {t.downloadCsv}
                  </a>
                  <a class="btn btn-outline" href={asset('data/download/tenders.jsonl')} download>
                    {t.downloadJsonl}
                  </a>
                </div>
              </div>
              <div class="card stack">
                <h2>{t.principlesTitle}</h2>
                <ul class="muted">
                  {t.principles.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </Loaded>
  );
}

function Hero({ provinces }: { provinces: ProvinceRow[] }) {
  const [, navigate] = useLocation();
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('');
  const submit = (e: Event) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (province) params.set('province', province);
    const qs = params.toString();
    navigate(qs ? `/tenders?${qs}` : '/tenders');
  };
  return (
    <section class="hero">
      <div class="container stack-lg">
        <h1>{t.title}</h1>
        <p class="hero-lead">{t.lead}</p>
        <form role="search" class="search" onSubmit={submit}>
          <label class="search-q">
            {t.searchLabel}
            <input type="search" value={q} placeholder={t.searchPlaceholder} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
          </label>
          <label class="search-p">
            {t.provinceLabel}
            <select value={province} onChange={(e) => setProvince((e.target as HTMLSelectElement).value)}>
              <option value="">{t.allProvinces}</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" class="btn btn-accent">
            {t.searchButton}
          </button>
        </form>
      </div>
    </section>
  );
}

function ProvinceTable({ rows }: { rows: ProvinceRow[] }) {
  return (
    <div class="table-wrap">
      <table aria-labelledby="tinh-thanh">
        <thead>
          <tr>
            <th>{t.colProvince}</th>
            <th class="r">{t.colTenders}</th>
            <th class="r">{t.colValue}</th>
            <th class="w-bar">{t.colSingle}</th>
            <th class="r">{t.colSavings}</th>
            <th class="r">{t.colTop5}</th>
            <th class="r">{t.colDisclosure}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td class="strong">
                <Link href={`/tenders?province=${p.id}`}>{p.name}</Link>
              </td>
              <td class="r num">{formatCount(p.tenders)}</td>
              <td class="r num">{formatVnd(p.award_value_vnd)}</td>
              <td>
                <div class="bar-row">
                  <Bar ratio={p.single_bidder_share.value} tone="orange" />
                  <span class="num">{formatPercent(p.single_bidder_share.value)}</span>
                </div>
              </td>
              <td class="r num">{formatPercent(p.avg_savings.value)}</td>
              <td class="r num">{formatPercent(p.top5_share.value)}</td>
              <td class="r num">{formatPercent(p.disclosure.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
