import { afterEach, describe, expect, it, vi } from 'vitest';
import { fileSha256, getStorageUploadUrl, replaceStorageFile, uploadStorageFile } from './storage';
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

  // sha256("rock"), as `printf rock | sha256sum` gives it.
  const ROCK = '350a770c0ec9f353e1a5629895f374fdaa299876c3870c03feb60eb4a3769d94';
  const rock = () => new File(['rock'], 'rock.glb', { type: 'model/gltf-binary' });
  const calls = (fetchMock: ReturnType<typeof answer>) => fetchMock.mock.calls as unknown as [string, RequestInit?][];

  it("hashes a file's bytes with SHA-256, in hex", async () => {
    expect(await fileSha256(rock())).toBe(ROCK);
  });

  it('declares the hash of a new asset, and uploads it with the headers it was answered with', async () => {
    const headers = { 'Content-Type': 'model/gltf-binary', 'x-amz-checksum-sha256': 'b64' };
    const fetchMock = answer(200, { url: 'https://upload.test/x', fileId: 'a1', headers });
    vi.stubGlobal('fetch', fetchMock);
    expect(await uploadStorageFile('p1', 'builtin', '3d-models', rock(), 'model/gltf-binary')).toMatchObject({ fileId: 'a1' });
    const [[asked], [put, init]] = calls(fetchMock);
    expect(new URL(asked).searchParams.get('sha256')).toBe(ROCK);
    expect(put).toBe('https://upload.test/x');
    expect(init).toMatchObject({ method: 'PUT', headers });
  });

  it('declares the hash of a new version too', async () => {
    const headers = { 'Content-Type': 'model/gltf-binary', 'x-amz-checksum-sha256': 'b64' };
    const fetchMock = answer(200, { url: 'https://upload.test/y', storageKey: 'k', fileId: 'a1', headers });
    vi.stubGlobal('fetch', fetchMock);
    await replaceStorageFile('p1', 'builtin', 'a1', rock());
    const [[asked], [, init]] = calls(fetchMock);
    const url = new URL(asked);
    expect(url.pathname).toMatch(/\/files\/a1\/replace-url$/);
    expect(url.searchParams.get('sha256')).toBe(ROCK);
    expect(init).toMatchObject({ method: 'PUT', headers });
  });

  it('reads a credits sheet, and tells why it failed', async () => {
    vi.stubGlobal('fetch', answer(404, { message: 'Credits sheet not found' }));
    await expect(getCreditsSheet('p1', 's1')).rejects.toThrow('Credits sheet not found');
  });
});
