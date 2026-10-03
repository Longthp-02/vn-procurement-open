import type {
  Buyer, BuyerRow, Contractor, ContractorRow, Meta, ProvinceRow, Tender, TenderRow, Topic, TopicRow,
} from './types';

/** Port: everything the pages read. Tests use an in-memory fake; production uses static JSON files. */
export interface DataSource {
  meta(): Promise<Meta>;
  provinces(): Promise<ProvinceRow[]>;
  topics(): Promise<TopicRow[]>;
  tenders(): Promise<TenderRow[]>;
  buyers(): Promise<BuyerRow[]>;
  contractors(): Promise<ContractorRow[]>;
  tender(id: string): Promise<Tender>;
  contractor(id: string): Promise<Contractor>;
  buyer(id: string): Promise<Buyer>;
  topic(id: string): Promise<Topic>;
}

export type DataErrorKind = 'not_found' | 'network' | 'invalid';

export class DataError extends Error {
  constructor(public kind: DataErrorKind, message: string) {
    super(message);
    this.name = 'DataError';
  }
}

type FetchFn = (url: string) => Promise<Response>;

// Ids come from the URL, so they are untrusted: allow only characters our generated ids use.
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

export function createStaticDataSource(base: string, fetchFn: FetchFn = (u) => fetch(u)): DataSource {
  const root = `${base.endsWith('/') ? base : `${base}/`}data/`;
  const cache = new Map<string, Promise<unknown>>();

  function load<T>(path: string): Promise<T> {
    const hit = cache.get(path);
    if (hit) return hit as Promise<T>;
    const p = (async () => {
      let res: Response;
      try {
        res = await fetchFn(root + path);
      } catch (e) {
        throw new DataError('network', `Could not load ${path}: ${(e as Error).message}`);
      }
      if (res.status === 404) throw new DataError('not_found', `${path} does not exist`);
      if (!res.ok) throw new DataError('network', `${path} returned HTTP ${res.status}`);
      try {
        return (await res.json()) as T;
      } catch {
        throw new DataError('invalid', `${path} is not valid JSON`);
      }
    })();
    cache.set(path, p);
    p.catch(() => cache.delete(path)); // failures are retried on the next call, not cached
    return p;
  }

  function entity<T>(folder: string, id: string): Promise<T> {
    if (!SAFE_ID.test(id)) return Promise.reject(new DataError('not_found', `Invalid id "${id}"`));
    return load<T>(`${folder}/${id}.json`);
  }

  return {
    meta: () => load('meta.json'),
    provinces: () => load('provinces.json'),
    topics: () => load('topics.json'),
    tenders: () => load('tenders.json'),
    buyers: () => load('buyers.json'),
    contractors: () => load('contractors.json'),
    tender: (id) => entity('tender', id),
    contractor: (id) => entity('contractor', id),
    buyer: (id) => entity('buyer', id),
    topic: (id) => entity('topic', id),
  };
}
