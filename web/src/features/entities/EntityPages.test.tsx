import { cleanup, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { renderAt } from '../../test/render';

afterEach(cleanup);

describe('Contractor page', () => {
  it('shows identity, totals and a neutrality note', async () => {
    renderAt('/contractor/sample-c-001');
    expect(await screen.findByRole('heading', { level: 1, name: 'Công ty TNHH Xây dựng Mẫu 001' })).toBeTruthy();
    expect(screen.getByText('0000000001')).toBeTruthy();
    expect(screen.getByText('37')).toBeTruthy();
    expect(screen.getByText('104,5 tỷ')).toBeTruthy();
    expect(screen.getByText(/không hàm ý đánh giá/)).toBeTruthy();
  });

  it('shows award value by year and frequent buyers', async () => {
    renderAt('/contractor/sample-c-001');
    const years = within(await screen.findByRole('region', { name: 'Giá trị trúng thầu theo năm' }));
    expect(years.getByText('2025')).toBeTruthy();
    expect(years.getByText('31,3 tỷ')).toBeTruthy();
    const buyers = within(screen.getByRole('region', { name: 'Bên mời thầu thường gặp' }));
    expect(buyers.getByRole('link', { name: /Ban QLDA Mẫu 01/ }).getAttribute('href')).toBe('/buyer/sample-b-hcm-01');
    expect(buyers.getByText(/28%/)).toBeTruthy();
  });

  it('shows not found for an unknown contractor', async () => {
    renderAt('/contractor/sample-c-999');
    expect(await screen.findByText('Không tìm thấy trang hoặc dữ liệu này.')).toBeTruthy();
  });
});

describe('Buyer page', () => {
  it('shows totals compared with the national average', async () => {
    renderAt('/buyer/sample-b-hcm-01');
    expect(await screen.findByRole('heading', { level: 1, name: /Ban QLDA Mẫu 01/ })).toBeTruthy();
    expect(screen.getByText('142')).toBeTruthy();
    expect(screen.getByText('Trung bình toàn quốc: 27%')).toBeTruthy();
  });

  it('shows disclosure per document type', async () => {
    renderAt('/buyer/sample-b-hcm-01');
    const docs = within(await screen.findByRole('region', { name: 'Mức độ công khai theo loại tài liệu' }));
    const row = docs.getByText('Báo cáo đánh giá').closest('li')!;
    expect(row.textContent).toContain('61%');
  });

  it('links top contractors', async () => {
    renderAt('/buyer/sample-b-hcm-01');
    const top = within(await screen.findByRole('region', { name: 'Nhà thầu trúng nhiều nhất' }));
    expect(top.getByRole('link', { name: /Xây dựng Mẫu 001/ }).getAttribute('href')).toBe('/contractor/sample-c-001');
  });
});

describe('List pages', () => {
  it('lists contractors with links', async () => {
    renderAt('/contractors');
    expect((await screen.findByRole('link', { name: 'Công ty TNHH Xây dựng Mẫu 001' })).getAttribute('href')).toBe('/contractor/sample-c-001');
  });

  it('lists buyers with links', async () => {
    renderAt('/buyers');
    expect((await screen.findByRole('link', { name: /Ban QLDA Mẫu 01/ })).getAttribute('href')).toBe('/buyer/sample-b-hcm-01');
  });
});

describe('Topic page', () => {
  it('shows the topic name, unit cost by province and largest tenders', async () => {
    renderAt('/topic/schools');
    expect(await screen.findByRole('heading', { level: 1, name: 'Xây dựng trường học' })).toBeTruthy();
    const cost = within(screen.getByRole('region', { name: 'Chi phí xây một phòng học, theo tỉnh' }));
    expect(cost.getByText('Khánh Hòa')).toBeTruthy();
    expect(cost.getByText('1.283')).toBeTruthy();
    expect(screen.getByRole('link', { name: /12 phòng học/ }).getAttribute('href')).toBe('/tender/SMP-2026-00001');
  });

  it('lists all topics', async () => {
    renderAt('/topics');
    expect((await screen.findByRole('link', { name: /Xây dựng trường học/ })).getAttribute('href')).toBe('/topic/schools');
  });

  it('shows not found for an unknown topic', async () => {
    renderAt('/topic/nope');
    expect(await screen.findByText('Không tìm thấy trang hoặc dữ liệu này.')).toBeTruthy();
  });
});

describe('Methodology page', () => {
  it('explains every indicator and its approval status', async () => {
    renderAt('/methodology');
    expect(await screen.findByRole('heading', { name: 'Phương pháp tính' })).toBeTruthy();
    expect(screen.getByText('Tỷ lệ gói chỉ có 1 nhà thầu')).toBeTruthy();
    expect(screen.getByText(/chờ chủ dự án duyệt/)).toBeTruthy();
  });
});
