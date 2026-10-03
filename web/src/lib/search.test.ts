import { describe, expect, it } from 'vitest';
import { filterTenders, normalizeVi } from './search';
import type { TenderRow } from './types';

const row = (over: Partial<TenderRow>): TenderRow => ({
  id: 'T', title: '', province: 'ho-chi-minh', sector: 'construction', method: 'open', topics: [],
  status: 'awarded', buyer: 'b', buyer_name: '', winner: null, winner_name: null, winner_tax: null,
  estimate: 1, award: 1, bidders: 1, date: '2026-01-01', docs: 7, ...over,
});

describe('normalizeVi', () => {
  it('removes diacritics, lowercases and maps đ to d', () => {
    expect(normalizeVi('Đà Nẵng')).toBe('da nang');
    expect(normalizeVi('Trường THCS Mẫu')).toBe('truong thcs mau');
  });
  it('collapses whitespace', () => {
    expect(normalizeVi('  xây   dựng ')).toBe('xay dung');
  });
});

describe('filterTenders', () => {
  const rows = [
    row({ id: 'A', title: 'Xây dựng khối phòng học', buyer_name: 'Ban QLDA Mẫu 01', province: 'ho-chi-minh' }),
    row({ id: 'B', title: 'Mua sắm máy thở', winner_name: 'Công ty Thiết bị Mẫu 002', winner_tax: '0000000002', province: 'ha-noi' }),
    row({ id: 'C', title: 'Nâng cấp tuyến đường', status: 'open', province: 'ha-noi' }),
  ];

  it('matches title words without diacritics, in any order', () => {
    expect(filterTenders(rows, { q: 'phong hoc xay' }).map((r) => r.id)).toEqual(['A']);
  });
  it('matches buyer name, winner name and tax code', () => {
    expect(filterTenders(rows, { q: 'ban qlda' }).map((r) => r.id)).toEqual(['A']);
    expect(filterTenders(rows, { q: 'thiết bị' }).map((r) => r.id)).toEqual(['B']);
    expect(filterTenders(rows, { q: '0000000002' }).map((r) => r.id)).toEqual(['B']);
  });
  it('matches the tender id', () => {
    expect(filterTenders(rows, { q: 'c' }).map((r) => r.id)).toContain('C');
  });
  it('filters by province and status', () => {
    expect(filterTenders(rows, { province: 'ha-noi' }).map((r) => r.id)).toEqual(['B', 'C']);
    expect(filterTenders(rows, { province: 'ha-noi', status: 'open' }).map((r) => r.id)).toEqual(['C']);
  });
  it('returns everything for an empty query and keeps input order', () => {
    expect(filterTenders(rows, { q: '   ' }).map((r) => r.id)).toEqual(['A', 'B', 'C']);
  });
});
