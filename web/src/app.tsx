import { Link, Route, Router, Switch, type BaseLocationHook, type BaseSearchHook } from 'wouter-preact';
import { ContractorPage } from './features/entities/ContractorPage';
import { BuyerPage } from './features/entities/BuyerPage';
import { BuyersPage, ContractorsPage } from './features/entities/ListPages';
import { HomePage } from './features/home/HomePage';
import { MethodologyPage } from './features/methodology/MethodologyPage';
import { TenderPage } from './features/tender/TenderPage';
import { TendersPage } from './features/tenders/TendersPage';
import { TopicPage, TopicsPage } from './features/topic/TopicPage';
import { vi } from './i18n/vi';
import { REPO_URL, reportIssueUrl } from './lib/config';
import type { DataSource } from './lib/data';
import { formatDate } from './lib/format';
import { NotFound } from './lib/ui';
import { DataContext, useData } from './lib/useData';

export type AppProps = { ds: DataSource; hook?: BaseLocationHook; searchHook?: BaseSearchHook; base?: string };

export function App({ ds, hook, searchHook, base }: AppProps) {
  return (
    <DataContext.Provider value={ds}>
      <Router hook={hook} searchHook={searchHook} base={base}>
        <Shell />
      </Router>
    </DataContext.Provider>
  );
}

function Shell() {
  return (
    <div class="shell">
      <a class="skip" href="#main">
        Bỏ qua điều hướng
      </a>
      <SampleBanner />
      <Header />
      <main id="main">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/tenders" component={TendersPage} />
          <Route path="/tender/:id">{(p) => <TenderPage id={p.id} />}</Route>
          <Route path="/contractors" component={ContractorsPage} />
          <Route path="/contractor/:id">{(p) => <ContractorPage id={p.id} />}</Route>
          <Route path="/buyers" component={BuyersPage} />
          <Route path="/buyer/:id">{(p) => <BuyerPage id={p.id} />}</Route>
          <Route path="/topics" component={TopicsPage} />
          <Route path="/topic/:id">{(p) => <TopicPage id={p.id} />}</Route>
          <Route path="/methodology" component={MethodologyPage} />
          <Route>
            <div class="container page">
              <NotFound />
            </div>
          </Route>
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function SampleBanner() {
  const meta = useData((ds) => ds.meta(), 'meta');
  if (meta.state !== 'ok' || !meta.data.is_sample) return null;
  return (
    <div class="banner" role="note">
      {vi.site.sampleBanner}
    </div>
  );
}

function Header() {
  return (
    <header class="header">
      <div class="container header-inner">
        <Link href="/" class="brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M2 10l10-6 10 6" />
          </svg>
          <span>{vi.site.name}</span>
        </Link>
        <nav aria-label="Chính" class="nav">
          <Link href="/tenders">{vi.nav.tenders}</Link>
          <Link href="/contractors">{vi.nav.contractors}</Link>
          <Link href="/buyers">{vi.nav.buyers}</Link>
          <Link href="/topics">{vi.nav.topics}</Link>
          <Link href="/methodology">{vi.nav.methodology}</Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const meta = useData((ds) => ds.meta(), 'meta');
  return (
    <footer class="footer">
      <div class="container footer-inner">
        <div class="stack-sm">
          <span>{vi.site.independent}</span>
          {meta.state === 'ok' && (
            <span>
              {vi.site.updated}: {formatDate(meta.data.collected_at)} · {vi.site.source}: {meta.data.source}
            </span>
          )}
        </div>
        <div class="row-wrap">
          <a href={reportIssueUrl('trang web')} target="_blank" rel="noopener noreferrer">
            {vi.site.reportError}
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            {vi.site.sourceCode}
          </a>
        </div>
      </div>
    </footer>
  );
}
