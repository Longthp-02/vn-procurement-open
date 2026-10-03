import { cleanup, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { renderAt } from '../../test/render';

afterEach(cleanup);

describe('Tender page', () => {
  it('renders the title as plain text (crawled text is untrusted)', async () => {
    renderAt('/tender/SMP-2026-00001');
    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('<script>alert(1)</script>');
    expect(document.querySelector('script')).toBeNull();
  });

  it('shows the key numbers', async () => {
    renderAt('/tender/SMP-2026-00001');
    const key = await screen.findByRole('region', { name: 'Số liệu chính' });
    const q = within(key);
    expect(q.getByText('18,4 tỷ')).toBeTruthy();
    expect(q.getByText('17,61 tỷ')).toBeTruthy();
    expect(q.getByText('−4,3%')).toBeTruthy();
    expect(q.getByText('3')).toBeTruthy();
  });

  it('compares indicators with the sector average', async () => {
    renderAt('/tender/SMP-2026-00001');
    const ind = within(await screen.findByRole('region', { name: 'Chỉ số so với các gói cùng lĩnh vực' }));
    expect(ind.getByText('86 ngày')).toBeTruthy();
    expect(ind.getByText('61 ngày')).toBeTruthy();
    expect(ind.getByText('3,2')).toBeTruthy();
    expect(ind.getByText('4,1%')).toBeTruthy();
  });

  it('lists which documents were published', async () => {
    renderAt('/tender/SMP-2026-00001');
    const docs = within(await screen.findByRole('region', { name: 'Mức độ công khai' }));
    expect(docs.getByText('5/7 tài liệu')).toBeTruthy();
    const missing = docs.getByText('Báo cáo đánh giá').closest('li')!;
    expect(missing.textContent).toContain('chưa công bố');
    const present = docs.getByText('Thông báo mời thầu').closest('li')!;
    expect(present.textContent).not.toContain('chưa công bố');
  });

  it('lists bidders with links to contractor profiles', async () => {
    renderAt('/tender/SMP-2026-00001');
    const table = await screen.findByRole('table', { name: 'Các nhà thầu tham gia' });
    const links = within(table).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/contractor/sample-c-001', '/contractor/sample-c-005', '/contractor/sample-c-009',
    ]);
    expect(within(table).getByText('Trúng thầu')).toBeTruthy();
    expect(within(table).getAllByText('Không trúng')).toHaveLength(2);
  });

  it('links the buyer and the winner with context', async () => {
    renderAt('/tender/SMP-2026-00001');
    expect((await screen.findByRole('link', { name: 'Xem hồ sơ bên mời thầu' })).getAttribute('href')).toBe('/buyer/sample-b-hcm-01');
    expect(screen.getByText('142 gói thầu từ 2022')).toBeTruthy();
    expect(screen.getByText('Đã trúng 6 gói của bên mời thầu này')).toBeTruthy();
  });

  it('says sample data has no original page', async () => {
    renderAt('/tender/SMP-2026-00001');
    expect(await screen.findByText('Dữ liệu mẫu: không có trang gốc.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Mở trang gốc' })).toBeNull();
  });

  it('explains unknown bidders instead of showing zero, and links the real source', async () => {
    renderAt('/tender/SMP-2026-00004');
    expect(await screen.findByText(/Biên bản mở thầu chưa được công bố/)).toBeTruthy();
    expect(screen.queryByRole('table', { name: 'Các nhà thầu tham gia' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Mở trang gốc' }).getAttribute('href')).toBe('https://muasamcong.mpi.gov.vn/example');
  });

  it('shows not found for an unknown tender', async () => {
    renderAt('/tender/SMP-0000-99999');
    expect(await screen.findByText('Không tìm thấy trang hoặc dữ liệu này.')).toBeTruthy();
  });
});
