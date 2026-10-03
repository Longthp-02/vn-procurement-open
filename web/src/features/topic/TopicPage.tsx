import { Link } from 'wouter-preact';
import { vi } from '../../i18n/vi';
import { formatCount, formatPercent, formatVnd } from '../../lib/format';
import { topicInfo } from '../../lib/topics';
import { Bar, Loaded, Section, Stat, TenderTable } from '../../lib/ui';
import { useData, useTitle } from '../../lib/useData';
import type { Topic, TopicRow } from '../../lib/types';

const t = vi.topicPage;

export function TopicPage({ id }: { id: string }) {
  const { name, desc } = topicInfo(id);
  useTitle(`${name} · ${vi.site.name}`);
  const result = useData((ds) => Promise.all([ds.topic(id), ds.topics(), ds.meta()]), `topic:${id}`);
  return (
    <Loaded result={result}>
      {([topic, all, meta]) => (
        <>
          <section class="hero hero-small">
            <div class="container stack">
              <nav aria-label="breadcrumb" class="small">
                <Link href="/topics">{vi.nav.topics}</Link> / {name}
              </nav>
              <h1>{name}</h1>
              <p class="hero-lead">{desc}</p>
              <TopicTabs all={all} current={id} />
            </div>
          </section>
          <div class="container page">
            <TopicView topic={topic} nationalSingle={meta.national.single_bidder_share.value} nationalDisclosure={meta.national.disclosure.value} />
          </div>
        </>
      )}
    </Loaded>
  );
}

function TopicTabs({ all, current }: { all: TopicRow[]; current: string }) {
  return (
    <nav class="row-wrap" aria-label={t.allTopics}>
      {all.map((tp) => (
        <Link key={tp.id} href={`/topic/${tp.id}`} class={`pill ${tp.id === current ? 'pill-active' : ''}`} aria-current={tp.id === current ? 'page' : undefined}>
          {topicInfo(tp.id).name}
        </Link>
      ))}
    </nav>
  );
}

function TopicView({ topic, nationalSingle, nationalDisclosure }: { topic: Topic; nationalSingle: number | null; nationalDisclosure: number | null }) {
  const costs = topic.unit_cost ?? [];
  const max = Math.max(1, ...costs.map((c) => c.value ?? 0));
  return (
    <div class="stack-xl">
      <div class="grid-cards">
        <Stat label={vi.cols.tenders} value={formatCount(topic.tenders)} />
        <Stat label={vi.cols.value} value={formatVnd(topic.award_value_vnd)} />
        <Stat label={vi.home.statSingle} value={formatPercent(topic.single_bidder_share.value)} note={vi.buyer.vsNational(formatPercent(nationalSingle))} />
        <Stat label={vi.buyer.disclosure} value={formatPercent(topic.disclosure.value)} note={vi.buyer.vsNational(formatPercent(nationalDisclosure))} />
      </div>

      {topic.unit === 'classroom' && costs.length > 0 && (
        <Section id="chi-phi-don-vi" title={t.unitCostTitle}>
          <p class="muted small">{t.unitCostText}</p>
          <ul class="card bars">
            {costs.map((c) => (
              <li key={c.province} class="bar-line">
                <span class="bar-label">{c.name}</span>
                <Bar ratio={(c.value ?? 0) / max} />
                <span class="num bar-value">{formatCount(c.value === null ? null : c.value / 1e6)}</span>
                <span class="muted xsmall">n={c.n}</span>
              </li>
            ))}
          </ul>
          <p class="muted small">{t.unitCostUnit}</p>
        </Section>
      )}

      <Section id="goi-lon-nhat" title={t.largest}>
        <TenderTable rows={topic.largest} labelledBy="goi-lon-nhat" />
      </Section>
    </div>
  );
}

export function TopicsPage() {
  useTitle(`${vi.nav.topics} · ${vi.site.name}`);
  const result = useData((ds) => ds.topics(), 'topics');
  return (
    <div class="container page stack-lg">
      <h1>{vi.nav.topics}</h1>
      <Loaded result={result}>
        {(all) => (
          <div class="grid-cards">
            {all.map((tp) => (
              <Link key={tp.id} href={`/topic/${tp.id}`} class="card topic-card">
                <span class="topic-name">{topicInfo(tp.id).name}</span>
                <span class="muted small">{topicInfo(tp.id).desc}</span>
                <span class="num muted small">
                  {vi.packages(formatCount(tp.tenders))} · {formatVnd(tp.award_value_vnd)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Loaded>
    </div>
  );
}
