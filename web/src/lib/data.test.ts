import { describe, expect, it, vi } from 'vitest';
import { DataError, createStaticDataSource } from './data';

function fakeFetch(responses: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    if (url in responses) return new Response(JSON.stringify(responses[url]), { status: 200 });
    return new Response('missing', { status: 404 });
  });
}

describe('createStaticDataSource', () => {
  it('reads files under <base>data/', async () => {
    const fetchFn = fakeFetch({ '/app/data/meta.json': { is_sample: true } });
    const ds = createStaticDataSource('/app/', fetchFn);
    await expect(ds.meta()).resolves.toEqual({ is_sample: true });
    expect(fetchFn).toHaveBeenCalledWith('/app/data/meta.json');
  });

  it('builds entity paths', async () => {
    const fetchFn = fakeFetch({ '/data/tender/SMP-2026-00001.json': { id: 'SMP-2026-00001' } });
    const ds = createStaticDataSource('/', fetchFn);
    await expect(ds.tender('SMP-2026-00001')).resolves.toEqual({ id: 'SMP-2026-00001' });
  });

  it('caches repeated reads of the same file', async () => {
    const fetchFn = fakeFetch({ '/data/provinces.json': [] });
    const ds = createStaticDataSource('/', fetchFn);
    await ds.provinces();
    await ds.provinces();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('rejects ids that could escape the data folder, without fetching', async () => {
    const fetchFn = fakeFetch({});
    const ds = createStaticDataSource('/', fetchFn);
    for (const bad of ['../meta', 'a/b', '', 'x?y', '%2e%2e']) {
      await expect(ds.contractor(bad)).rejects.toMatchObject({ kind: 'not_found' });
    }
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('reports a missing file as not_found instead of returning empty data', async () => {
    const ds = createStaticDataSource('/', fakeFetch({}));
    const err = await ds.buyer('nope').catch((e) => e);
    expect(err).toBeInstanceOf(DataError);
    expect(err.kind).toBe('not_found');
  });

  it('adds a missing trailing slash to the base path', async () => {
    const fetchFn = fakeFetch({ '/app/data/topics.json': [] });
    await createStaticDataSource('/app', fetchFn).topics();
    expect(fetchFn).toHaveBeenCalledWith('/app/data/topics.json');
  });

  it('reports server errors as network errors', async () => {
    const ds = createStaticDataSource('/', vi.fn(async () => new Response('boom', { status: 500 })));
    await expect(ds.meta()).rejects.toMatchObject({ kind: 'network', message: expect.stringContaining('500') });
  });

  it('treats the static host\'s HTML fallback for a missing file as not_found', async () => {
    // Cloudflare Pages and `vite preview` answer unknown paths with index.html and HTTP 200.
    const html = new Response('<!doctype html><html></html>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
    const ds = createStaticDataSource('/', vi.fn(async () => html));
    await expect(ds.topic('constructor')).rejects.toMatchObject({ kind: 'not_found' });
  });

  it('reports malformed JSON as invalid', async () => {
    const ds = createStaticDataSource('/', vi.fn(async () => new Response('{not json', { status: 200 })));
    await expect(ds.tenders()).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('exposes every list and entity file', async () => {
    const files = ['buyers', 'contractors', 'tenders', 'topics', 'provinces', 'meta', 'latest'];
    const fetchFn = fakeFetch(Object.fromEntries([
      ...files.map((f) => [`/data/${f}.json`, f]),
      ...['tender', 'contractor', 'buyer', 'topic'].map((f) => [`/data/${f}/x1.json`, f]),
    ]));
    const ds = createStaticDataSource('/', fetchFn);
    expect(await Promise.all([ds.buyers(), ds.contractors(), ds.tenders(), ds.topics(), ds.provinces(), ds.meta(), ds.latest()])).toEqual(files);
    expect(await Promise.all([ds.tender('x1'), ds.contractor('x1'), ds.buyer('x1'), ds.topic('x1')])).toEqual(['tender', 'contractor', 'buyer', 'topic']);
  });

  it('reports network failures as a network error and does not cache them', async () => {
    let calls = 0;
    const fetchFn = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('offline');
      return new Response('[]', { status: 200 });
    });
    const ds = createStaticDataSource('/', fetchFn);
    await expect(ds.topics()).rejects.toMatchObject({ kind: 'network' });
    await expect(ds.topics()).resolves.toEqual([]);
  });
});
