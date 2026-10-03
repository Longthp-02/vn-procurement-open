import { cleanup, fireEvent, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { DataError } from '../../lib/data';
import { fakeDataSource, meta } from '../../test/fixtures';
import { renderAt } from '../../test/render';

afterEach(cleanup);

describe('Home page', () => {
  it('shows national indicators with the number of tenders each is based on', async () => {
    renderAt('/');
    const overview = await screen.findByRole('region', { name: 'Tổng quan' });
    const q = within(overview);
    expect(q.getByText('1.610')).toBeTruthy();
    expect(q.getByText('58.300 tỷ')).toBeTruthy();
    expect(q.getByText('27%')).toBeTruthy();
    expect(q.getByText('3,1%')).toBeTruthy();
    expect(q.getAllByText('Tính trên 10 gói').length).toBeGreaterThan(0);
  });

  it('compares provinces in a table', async () => {
    renderAt('/');
    const table = await screen.findByRole('table', { name: 'So sánh giữa các tỉnh thành' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2 provinces
    expect(within(rows[1]).getByText('TP. Hồ Chí Minh')).toBeTruthy();
    expect(within(rows[1]).getByText('23%')).toBeTruthy();
    expect(within(rows[1]).getByText('86%')).toBeTruthy();
  });

  it('links topic cards to topic pages', async () => {
    renderAt('/');
    const link = await screen.findByRole('link', { name: /Xây dựng trường học/ });
    expect(link.getAttribute('href')).toBe('/topic/schools');
  });

  it('lists the latest awards, linking to tender pages and rendering titles as plain text', async () => {
    renderAt('/');
    const latest = await screen.findByRole('region', { name: 'Kết quả trúng thầu mới nhất' });
    const first = within(latest).getByRole('link', { name: /12 phòng học/ });
    expect(first.getAttribute('href')).toBe('/tender/SMP-2026-00001');
    expect(within(latest).getAllByText(/Công ty TNHH Xây dựng Mẫu 001/).length).toBeGreaterThan(0);
    expect(document.querySelector('script')).toBeNull();
  });

  it('does not download the full tender index (review P2-4)', async () => {
    renderAt('/', fakeDataSource({ tenders: async () => { throw new Error('home must not load tenders.json'); } }));
    const latest = await screen.findByRole('region', { name: 'Kết quả trúng thầu mới nhất' });
    expect(within(latest).getByRole('link', { name: /12 phòng học/ })).toBeTruthy();
  });

  it('sends the search to the tender list', async () => {
    const { location } = renderAt('/');
    fireEvent.input(await screen.findByLabelText(/Tìm gói thầu/), { target: { value: 'phòng học' } });
    fireEvent.change(screen.getByLabelText('Tỉnh thành'), { target: { value: 'ha-noi' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(location.history?.at(-1)).toBe('/tenders?q=ph%C3%B2ng+h%E1%BB%8Dc&province=ha-noi');
  });

  it('links the open-data downloads', async () => {
    renderAt('/');
    expect((await screen.findByRole('link', { name: 'Tải CSV' })).getAttribute('href')).toBe('/data/download/tenders.csv');
  });

  it('shows an error with a retry button when data cannot load, and recovers', async () => {
    let fail = true;
    const ds = fakeDataSource({
      meta: async () => {
        if (fail) throw new DataError('network', 'offline');
        return meta;
      },
    });
    renderAt('/', ds);
    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    expect(screen.getAllByText(/Không tải được dữ liệu/).length).toBeGreaterThan(0);
    fail = false;
    fireEvent.click(retry);
    expect(await screen.findByRole('region', { name: 'Tổng quan' })).toBeTruthy();
  });
});
