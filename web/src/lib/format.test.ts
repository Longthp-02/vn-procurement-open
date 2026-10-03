import { describe, expect, it } from 'vitest';
import { formatCount, formatDate, formatDays, formatPercent, formatVnd } from './format';

describe('formatVnd', () => {
  it('uses "tỷ" with two decimals for billions', () => {
    expect(formatVnd(17_610_000_000)).toBe('17,61 tỷ');
  });
  it('drops trailing zero decimals and groups thousands of billions', () => {
    expect(formatVnd(58_300_000_000_000)).toBe('58.300 tỷ');
    expect(formatVnd(4_200_000_000)).toBe('4,2 tỷ');
  });
  it('uses "triệu" for millions', () => {
    expect(formatVnd(850_000_000)).toBe('850 triệu');
  });
  it('uses "đồng" below a million', () => {
    expect(formatVnd(500_000)).toBe('500.000 đồng');
  });
  it('shows a dash for unknown values instead of zero', () => {
    expect(formatVnd(null)).toBe('—');
    expect(formatVnd(undefined)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('formats a ratio with a Vietnamese decimal comma', () => {
    expect(formatPercent(0.043)).toBe('4,3%');
    expect(formatPercent(0.27)).toBe('27%');
  });
  it('supports a signed change', () => {
    expect(formatPercent(-0.043, { signed: true })).toBe('−4,3%');
    expect(formatPercent(0.05, { signed: true })).toBe('+5%');
  });
  it('shows a dash for unknown values', () => {
    expect(formatPercent(null)).toBe('—');
  });
});

describe('formatCount', () => {
  it('groups thousands with dots', () => {
    expect(formatCount(48215)).toBe('48.215');
  });
  it('rounds averages to one decimal', () => {
    expect(formatCount(2.74, 1)).toBe('2,7');
  });
  it('shows a dash for unknown values', () => {
    expect(formatCount(null)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats ISO dates as dd/mm/yyyy without timezone shifts', () => {
    expect(formatDate('2026-09-28')).toBe('28/09/2026');
    expect(formatDate('2026-10-03T00:00:00+00:00')).toBe('03/10/2026');
  });
  it('shows a dash for missing dates', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('formatDays', () => {
  it('appends "ngày"', () => {
    expect(formatDays(67)).toBe('67 ngày');
    expect(formatDays(null)).toBe('—');
  });
});
