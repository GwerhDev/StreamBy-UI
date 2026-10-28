import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStorageUploadUrl } from './storage';
import { getCreditsSheet } from './creditsSheets';

const answer = (status: number, body: unknown) => vi.fn(async () => ({ ok: status < 400, status, json: async () => body }));
afterEach(() => vi.unstubAllGlobals());

describe('storage service', () => {
  it('asks for an upload URL with the license metadata given, leaving out the empty fields', async () => {
    const fetchMock = answer(200, { url: 'https://upload.test/x', fileId: 'a1' });
    vi.stubGlobal('fetch', fetchMock);
    await getStorageUploadUrl('p1', 'builtin', 'images', 'rock.png', 'image/png', { creatorName: 'Jane Doe', licenseType: 'CC BY', sourceUrl: null, comments: ' ' });
    const url = new URL((fetchMock.mock.calls[0] as unknown as [string])[0]);
    expect(url.pathname).toMatch(/\/projects\/p1\/connections\/storage\/builtin\/upload-url$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({ fileName: 'rock.png', contentType: 'image/png', category: 'images', creatorName: 'Jane Doe', licenseType: 'CC BY' });
  });

  it('reads a credits sheet, and tells why it failed', async () => {
    vi.stubGlobal('fetch', answer(404, { message: 'Credits sheet not found' }));
    await expect(getCreditsSheet('p1', 's1')).rejects.toThrow('Credits sheet not found');
  });
});
