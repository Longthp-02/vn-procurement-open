import type { Status, TenderRow } from './types';

export type TenderFilter = { q?: string; province?: string; status?: Status | '' };

/** Lowercase, strip Vietnamese diacritics (đ → d) and collapse whitespace, so "Đà Nẵng" matches "da nang". */
export function normalizeVi(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalizing every row on every keystroke is wasteful; rows are immutable, so cache per row object.
const haystacks = new WeakMap<TenderRow, string>();
function haystack(r: TenderRow): string {
  let h = haystacks.get(r);
  if (h === undefined) {
    h = normalizeVi([r.id, r.title, r.buyer_name, r.winner_name ?? '', r.winner_tax ?? ''].join(' '));
    haystacks.set(r, h);
  }
  return h;
}

/** Every query word must appear somewhere in the tender's searchable text. Input order is preserved. */
export function filterTenders(rows: TenderRow[], filter: TenderFilter): TenderRow[] {
  const words = normalizeVi(filter.q ?? '').split(' ').filter(Boolean);
  return rows.filter(
    (r) =>
      (!filter.province || r.province === filter.province) &&
      (!filter.status || r.status === filter.status) &&
      words.every((w) => haystack(r).includes(w)),
  );
}
