// Shapes of the JSON written by pipeline/build_site_data.py (see docs/data-contract.md).

export type Indicator = { value: number | null; n: number };
export type Status = 'awarded' | 'open' | 'cancelled';
export type DocKey = 'plan' | 'notice' | 'tender_docs' | 'opening_minutes' | 'evaluation_report' | 'award' | 'contract';
export const DOC_KEYS: DocKey[] = ['plan', 'notice', 'tender_docs', 'opening_minutes', 'evaluation_report', 'award', 'contract'];

export type GroupIndicators = {
  tenders: number;
  awarded: number;
  award_value_vnd: number;
  single_bidder_share: Indicator;
  avg_bidders: Indicator;
  avg_savings: Indicator;
  median_days: Indicator;
  disclosure: Indicator;
  top5_share: Indicator;
};

export type SectorBaseline = { avg_bidders: Indicator; avg_savings: Indicator; median_days: Indicator };

export type Meta = {
  generated_at: string;
  collected_at: string;
  is_sample: boolean;
  source: string;
  years: [string, string] | null;
  counts: { tenders: number; buyers: number; contractors: number };
  national: GroupIndicators;
  sectors: Record<string, SectorBaseline>;
};

export type ProvinceRow = GroupIndicators & { id: string; name: string };
export type TopicRow = GroupIndicators & { id: string };

export type TenderRow = {
  id: string;
  title: string;
  province: string;
  sector: string;
  method: string;
  topics: string[];
  status: Status;
  buyer: string;
  buyer_name: string;
  winner: string | null;
  winner_name: string | null;
  winner_tax: string | null;
  estimate: number | null;
  award: number | null;
  bidders: number | null;
  date: string | null;
  docs: number;
};

export type ContractorRef = { id: string; tax_code: string; name: string };
export type Bid = { contractor: ContractorRef; amount_vnd: number | null; won: boolean };

export type Tender = {
  id: string;
  title: string;
  province: { id: string; name: string };
  sector: string;
  method: string;
  topics: string[];
  funding: string | null;
  buyer: { id: string; name: string; kind: string };
  status: Status;
  estimate_vnd: number | null;
  award_vnd: number | null;
  bids: Bid[] | null;
  documents: Record<DocKey, boolean>;
  dates: { plan: string | null; notice: string | null; opening: string | null; award: string | null };
  units: { kind: string; count: number } | null;
  source_url: string | null;
  collected_at: string;
  derived: { bidders: number | null; savings: number | null; days: number | null; disclosure: number };
  context: {
    sector: SectorBaseline;
    buyer_tenders: number;
    buyer_since: string | null;
    winner_wins_with_buyer: number | null;
  };
};

export type ShareRow = { id: string; name: string; count: number; value_vnd: number; share: number | null };

export type Contractor = ContractorRef & {
  bids: number;
  wins: number;
  award_value_vnd: number;
  buyers: number;
  provinces: string[];
  by_year: { year: string; value_vnd: number }[];
  top_buyers: ShareRow[];
  recent_wins: TenderRow[];
};

export type Buyer = GroupIndicators & {
  id: string;
  name: string;
  kind: string;
  province: { id: string; name: string };
  since: string | null;
  documents: Record<DocKey, Indicator>;
  top_contractors: ShareRow[];
  recent: TenderRow[];
};

export type Topic = TopicRow & {
  unit: string | null;
  unit_cost: ({ province: string; name: string } & Indicator)[] | null;
  largest: TenderRow[];
};

export type BuyerRow = { id: string; name: string; kind: string; province: string; tenders: number; award_value_vnd: number; disclosure: number | null };
export type ContractorRow = { id: string; name: string; tax_code: string; bids: number; wins: number; award_value_vnd: number };
