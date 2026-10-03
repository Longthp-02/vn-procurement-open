import { cleanup, fireEvent, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { fakeDataSource, tenderRows } from '../../test/fixtures';
import { renderAt } from '../../test/render';

afterEach(cleanup);

describe('Tender list page', () => {
  it('filters by the query in the URL, ignoring diacritics', async () => {
    renderAt('/tenders?q=may%20tho');
    expect(await screen.findByText('1 gói thầu')).toBeTruthy();
    expect(screen.getByRole('link', { name: /máy thở/ }).getAttribute('href')).toBe('/tender/SMP-2026-00002');
  });

  it('filters by province and status from the URL', async () => {
    renderAt('/tenders?province=ho-chi-minh&status=open');
    expect(await screen.findByText('1 gói thầu')).toBeTruthy();
    expect(screen.getByText('Chưa có kết quả')).toBeTruthy();
  });

  it('shows all tenders without filters and keeps the search box filled', async () => {
    renderAt('/tenders?q=');
    expect(await screen.findByText('3 gói thầu')).toBeTruthy();
  });

  it('applies the filter form to the URL and resets to page 1', async () => {
    const { location } = renderAt('/tenders?page=2');
    fireEvent.input(await screen.findByLabelText(/Tìm gói thầu/), { target: { value: 'máy thở' } });
    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'awarded' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(location.history?.at(-1)).toBe('/tenders?q=m%C3%A1y+th%E1%BB%9F&status=awarded');
  });

  it('paginates 20 tenders per page', async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ ...tenderRows[0], id: `SMP-2026-${String(i + 1).padStart(5, '0')}` }));
    renderAt('/tenders', fakeDataSource({ tenders: async () => many }));
    expect(await screen.findByText('25 gói thầu')).toBeTruthy();
    expect(screen.getAllByRole('article')).toHaveLength(20);
    expect(screen.getByText('Trang 1/2')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Trang sau' }).getAttribute('href')).toBe('/tenders?page=2');
    cleanup();
    renderAt('/tenders?page=2', fakeDataSource({ tenders: async () => many }));
    await screen.findByText('Trang 2/2');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('link', { name: 'Trang trước' }).getAttribute('href')).toBe('/tenders?page=1');
  });

  it('says so when nothing matches', async () => {
    renderAt('/tenders?q=khong%20co%20goi%20nao');
    expect(await screen.findByText('Không có gói thầu nào khớp với tìm kiếm.')).toBeTruthy();
  });
});
