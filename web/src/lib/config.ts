import { vi } from '../i18n/vi';

export const REPO_URL = 'https://github.com/Longthp-02/vn-procurement-open';

/** Public path of a file under web/public (respects the deploy base path). */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export function reportIssueUrl(context: string): string {
  const params = new URLSearchParams({ title: vi.site.issueTitle(context), labels: 'data-error' });
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

// Source links come from crawled data and end up in <a href>: only the official system over HTTPS.
// Mirrors SOURCE_HOSTS in pipeline/build_site_data.py (defense in depth).
const SOURCE_HOSTS = new Set(['muasamcong.mpi.gov.vn', 'muasamcong.mof.gov.vn']);

export function officialSourceUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && SOURCE_HOSTS.has(u.hostname) ? url : null;
  } catch {
    return null;
  }
}
