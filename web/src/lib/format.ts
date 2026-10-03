// Number and date formatting for Vietnamese readers. Unknown values render as a dash, never as zero.
import { vi } from '../i18n/vi';

export const DASH = '—';
const MINUS = '−'; // U+2212, typographically correct minus sign

const formatters = new Map<number, Intl.NumberFormat>();
function num(value: number, maxDecimals: number): string {
  let f = formatters.get(maxDecimals);
  if (!f) {
    f = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: maxDecimals, minimumFractionDigits: 0 });
    formatters.set(maxDecimals, f);
  }
  return f.format(value);
}

function known(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function formatVnd(value: number | null | undefined): string {
  if (!known(value)) return DASH;
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${num(value / 1e9, 2)} ${vi.units.billion}`;
  if (abs >= 1e6) return `${num(value / 1e6, 1)} ${vi.units.million}`;
  return `${num(value, 0)} ${vi.units.dong}`;
}

export function formatPercent(ratio: number | null | undefined, opts: { signed?: boolean } = {}): string {
  if (!known(ratio)) return DASH;
  const pct = ratio * 100;
  const body = `${num(Math.abs(pct), 1)}%`;
  if (pct < 0) return `${MINUS}${body}`;
  return opts.signed && pct > 0 ? `+${body}` : body;
}

export function formatCount(value: number | null | undefined, decimals = 0): string {
  return known(value) ? num(value, decimals) : DASH;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const [y, m, d] = iso.slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : DASH;
}

export function formatDays(days: number | null | undefined): string {
  return known(days) ? `${num(days, 0)} ${vi.units.days}` : DASH;
}
