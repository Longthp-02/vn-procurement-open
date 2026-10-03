export const REPO_URL = 'https://github.com/Longthp-02/vn-procurement-open';

/** Public path of a file under web/public (respects the deploy base path). */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export function reportIssueUrl(context: string): string {
  const params = new URLSearchParams({ title: `Sai dữ liệu: ${context}`, labels: 'data-error' });
  return `${REPO_URL}/issues/new?${params.toString()}`;
}
