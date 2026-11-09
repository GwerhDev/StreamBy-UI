import { afterEach, describe, expect, it, vi } from 'vitest';
import { markDeliverable } from './deliverables';

const answer = (status: number, body: unknown) => vi.fn(async () => ({ ok: status < 400, status, json: async () => body }));
afterEach(() => vi.unstubAllGlobals());

describe('markDeliverable', () => {
  it('marks an asset as a deliverable of an export, and answers its status and the jobs started', async () => {
    const deliverable = { id: 'd1', assetId: 'a1', exportId: 'e1', status: 'blocked', gated: true, blockedBy: [] };
    const fetchMock = answer(201, { deliverable, jobs: [] });
    vi.stubGlobal('fetch', fetchMock);
    expect(await markDeliverable('p1', 'a1', { exportId: 'e1' })).toEqual({ deliverable, jobs: [] });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/streamby\/projects\/p1\/deliverables$/);
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(init.body as string)).toEqual({ assetId: 'a1', exportId: 'e1' });
  });

  it('can mark one of its versions, for a shot', async () => {
    const fetchMock = answer(201, { deliverable: { id: 'd1' } });
    vi.stubGlobal('fetch', fetchMock);
    expect((await markDeliverable('p1', 'a1', { shotId: 's1', versionId: 'v2' })).jobs).toEqual([]);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ assetId: 'a1', shotId: 's1', versionId: 'v2' });
  });

  it('tells why it failed', async () => {
    vi.stubGlobal('fetch', answer(404, { message: 'Asset not found' }));
    await expect(markDeliverable('p1', 'gone', { exportId: 'e1' })).rejects.toThrow('Asset not found');
  });
});
