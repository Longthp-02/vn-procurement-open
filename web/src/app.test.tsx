import { cleanup, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { fakeDataSource, meta } from './test/fixtures';
import { renderAt } from './test/render';

afterEach(cleanup);

describe('App shell', () => {
  it('shows the sample-data banner on every page when data is sample', async () => {
    renderAt('/methodology');
    expect(await screen.findByText(/dữ liệu mẫu để thử giao diện/)).toBeTruthy();
  });

  it('hides the banner for real data', async () => {
    renderAt('/methodology', fakeDataSource({ meta: async () => ({ ...meta, is_sample: false }) }));
    await screen.findByRole('heading', { name: 'Phương pháp tính' });
    expect(screen.queryByText(/dữ liệu mẫu để thử giao diện/)).toBeNull();
  });

  it('has navigation links to the main sections', () => {
    renderAt('/methodology');
    const nav = screen.getByRole('navigation', { name: 'Chính' });
    const hrefs = [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/tenders', '/contractors', '/buyers', '/methodology']));
  });

  it('shows a not-found page with a way home for unknown routes', async () => {
    renderAt('/no-such-page');
    expect(await screen.findByText('Không tìm thấy trang hoặc dữ liệu này.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Về trang chủ' }).getAttribute('href')).toBe('/');
  });

  it('shows the independence statement and an error-report link in the footer', () => {
    renderAt('/methodology');
    expect(screen.getByText(/Dự án độc lập/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Báo sai dữ liệu' }).getAttribute('href')).toContain('github.com/Longthp-02/vn-procurement-open/issues');
  });
});
