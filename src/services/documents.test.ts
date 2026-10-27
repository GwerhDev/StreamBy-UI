import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, conflictOf, getDocuments, saveDocument } from './documents';
import { doc } from '../test/documents';

const answer = (status: number, body: unknown) => vi.fn(async () => ({ ok: status < 400, status, json: async () => body }));
afterEach(() => vi.unstubAllGlobals());

describe('documents service', () => {
  it('asks with the session, and unwraps the answer', async () => {
    const fetchMock = answer(200, { documents: [doc()] });
    vi.stubGlobal('fetch', fetchMock);
    expect((await getDocuments('p1')).map(d => d.id)).toEqual(['d1']);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/streamby\/projects\/p1\/documents$/);
    expect(init.credentials).toBe('include');
  });

  it('sends the version a save was made on, and tells a conflict apart, with the document as it is now', async () => {
    const now = doc({ version: 3 });
    const fetchMock = answer(409, { message: 'The document changed', document: now });
    vi.stubGlobal('fetch', fetchMock);
    const err = await saveDocument('p1', 'd1', 2, { content: 'x' }).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(conflictOf(err)).toEqual(now);
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({ baseVersion: 2, content: 'x' });

    expect(conflictOf(new ApiError('nope', 403, {}))).toBeNull();
    expect(conflictOf(new Error('down'))).toBeNull();
  });
});
