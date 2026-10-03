// A tiny, internally consistent dataset and an in-memory DataSource fake for behavior tests.
import { DataError, type DataSource } from '../lib/data';
import type {
  Buyer, BuyerRow, Contractor, ContractorRow, GroupIndicators, Meta, ProvinceRow, Tender, TenderRow, Topic, TopicRow,
} from '../lib/types';

const ind = (value: number | null, n = 10) => ({ value, n });
const group = (over: Partial<GroupIndicators> = {}): GroupIndicators => ({
  tenders: 120, awarded: 100, award_value_vnd: 58_300_000_000_000,
  single_bidder_share: ind(0.27), avg_bidders: ind(2.74), avg_savings: ind(0.031), median_days: ind(67),
  disclosure: ind(0.838), top5_share: ind(0.11), ...over,
});

export const meta: Meta = {
  generated_at: '2026-10-03T10:00:00+00:00', collected_at: '2026-10-03T00:00:00+00:00', is_sample: true,
  source: 'muasamcong.mpi.gov.vn', years: ['2022', '2026'], counts: { tenders: 1800, buyers: 60, contractors: 160 },
  national: group({ tenders: 1800, awarded: 1610 }),
  sectors: { construction: { avg_bidders: ind(3.2), avg_savings: ind(0.041), median_days: ind(61) } },
};

export const provinces: ProvinceRow[] = [
  { id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh', ...group({ tenders: 531, single_bidder_share: ind(0.23), disclosure: ind(0.86) }) },
  { id: 'ha-noi', name: 'Hà Nội', ...group({ tenders: 471, single_bidder_share: ind(0.25) }) },
];

export const topics: TopicRow[] = [{ id: 'schools', ...group({ tenders: 388, award_value_vnd: 21_600_000_000_000 }) }];

const row = (over: Partial<TenderRow>): TenderRow => ({
  id: 'SMP-2026-00001', title: 'Xây dựng khối 12 phòng học, Trường THCS Mẫu 07', province: 'ho-chi-minh',
  sector: 'construction', method: 'open', topics: ['schools'], status: 'awarded', buyer: 'sample-b-hcm-01',
  buyer_name: 'Ban QLDA Mẫu 01 (TP. Hồ Chí Minh)', winner: 'sample-c-001', winner_name: 'Công ty TNHH Xây dựng Mẫu 001',
  winner_tax: '0000000001', estimate: 18_400_000_000, award: 17_610_000_000, bidders: 3, date: '2026-09-28', docs: 5, ...over,
});

export const tenderRows: TenderRow[] = [
  row({}),
  row({ id: 'SMP-2026-00002', title: 'Mua sắm máy thở cho đơn vị y tế Mẫu 12', province: 'ha-noi', sector: 'goods',
    topics: ['medical-equipment'], buyer: 'sample-b-hn-02', buyer_name: 'Bệnh viện Mẫu 02 (Hà Nội)', winner: 'sample-c-002',
    winner_name: 'Công ty CP Thiết bị Mẫu 002', winner_tax: '0000000002', bidders: 1, date: '2026-09-27' }),
  row({ id: 'SMP-2026-00003', title: 'Nâng cấp tuyến đường Mẫu 03 <script>alert(1)</script>', status: 'open', award: null,
    winner: null, winner_name: null, winner_tax: null, bidders: null, date: '2026-09-20' }),
];

export const tender: Tender = {
  id: 'SMP-2026-00001', title: 'Xây dựng khối 12 phòng học, Trường THCS Mẫu 07 <script>alert(1)</script>',
  province: { id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh' }, sector: 'construction', method: 'open', topics: ['schools'],
  funding: 'Ngân sách địa phương', buyer: { id: 'sample-b-hcm-01', name: 'Ban QLDA Mẫu 01 (TP. Hồ Chí Minh)', kind: 'pmu' },
  status: 'awarded', estimate_vnd: 18_400_000_000, award_vnd: 17_610_000_000,
  bids: [
    { contractor: { id: 'sample-c-001', tax_code: '0000000001', name: 'Công ty TNHH Xây dựng Mẫu 001' }, amount_vnd: 17_610_000_000, won: true },
    { contractor: { id: 'sample-c-005', tax_code: '0000000005', name: 'Công ty CP Công trình Mẫu 005' }, amount_vnd: 17_950_000_000, won: false },
    { contractor: { id: 'sample-c-009', tax_code: '0000000009', name: 'Công ty TNHH Kỹ thuật Mẫu 009' }, amount_vnd: 18_220_000_000, won: false },
  ],
  documents: { plan: true, notice: true, tender_docs: true, opening_minutes: true, evaluation_report: false, award: true, contract: false },
  dates: { plan: '2026-06-12', notice: '2026-07-04', opening: '2026-07-25', award: '2026-09-28' },
  units: { kind: 'classroom', count: 12 }, source_url: null, collected_at: '2026-10-03T00:00:00+00:00',
  derived: { bidders: 3, savings: 0.0429, days: 86, disclosure: 5 / 7 },
  context: { sector: meta.sectors.construction, buyer_tenders: 142, buyer_since: '2022', winner_wins_with_buyer: 6 },
};

export const tenderUnknownBids: Tender = {
  ...tender, id: 'SMP-2026-00004', title: 'Gói không có biên bản mở thầu', bids: null,
  documents: { ...tender.documents, opening_minutes: false }, derived: { ...tender.derived, bidders: null },
  source_url: 'https://muasamcong.mpi.gov.vn/example', context: { ...tender.context, winner_wins_with_buyer: null },
};

export const contractor: Contractor = {
  id: 'sample-c-001', tax_code: '0000000001', name: 'Công ty TNHH Xây dựng Mẫu 001', bids: 50, wins: 37,
  award_value_vnd: 104_500_000_000, buyers: 14, provinces: ['TP. Hồ Chí Minh'],
  by_year: [{ year: '2025', value_vnd: 26_700_000_000 }, { year: '2026', value_vnd: 31_300_000_000 }],
  top_buyers: [{ id: 'sample-b-hcm-01', name: 'Ban QLDA Mẫu 01 (TP. Hồ Chí Minh)', count: 6, value_vnd: 29_000_000_000, share: 0.28 }],
  recent_wins: [tenderRows[0]],
};

export const buyer: Buyer = {
  id: 'sample-b-hcm-01', name: 'Ban QLDA Mẫu 01 (TP. Hồ Chí Minh)', kind: 'pmu',
  province: { id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh' }, since: '2022',
  ...group({ tenders: 142, single_bidder_share: ind(0.19), disclosure: ind(0.87) }),
  documents: {
    plan: ind(0.99), notice: ind(1), tender_docs: ind(0.98), opening_minutes: ind(0.92),
    evaluation_report: ind(0.61), award: ind(0.95), contract: ind(0.54),
  },
  top_contractors: [{ id: 'sample-c-001', name: 'Công ty TNHH Xây dựng Mẫu 001', count: 6, value_vnd: 50_000_000_000, share: 0.14 }],
  recent: [tenderRows[0]],
};

export const topic: Topic = {
  ...topics[0], unit: 'classroom',
  unit_cost: [
    { province: 'khanh-hoa', name: 'Khánh Hòa', value: 1_283_000_000, n: 29 },
    { province: 'can-tho', name: 'Cần Thơ', value: 860_000_000, n: 42 },
  ],
  largest: [tenderRows[0]],
};

export const buyerRows: BuyerRow[] = [{ id: buyer.id, name: buyer.name, kind: 'pmu', province: 'ho-chi-minh', tenders: 142, award_value_vnd: 386_200_000_000, disclosure: 0.87 }];
export const contractorRows: ContractorRow[] = [{ id: contractor.id, name: contractor.name, tax_code: contractor.tax_code, bids: 50, wins: 37, award_value_vnd: 104_500_000_000 }];

export function fakeDataSource(over: Partial<DataSource> = {}): DataSource {
  const byId = <T,>(map: Record<string, T>) => async (id: string): Promise<T> => {
    if (id in map) return map[id];
    throw new DataError('not_found', id);
  };
  return {
    meta: async () => meta,
    provinces: async () => provinces,
    topics: async () => topics,
    tenders: async () => tenderRows,
    buyers: async () => buyerRows,
    contractors: async () => contractorRows,
    tender: byId({ [tender.id]: tender, [tenderUnknownBids.id]: tenderUnknownBids }),
    contractor: byId({ [contractor.id]: contractor }),
    buyer: byId({ [buyer.id]: buyer }),
    topic: byId({ [topic.id]: topic }),
    ...over,
  };
}
