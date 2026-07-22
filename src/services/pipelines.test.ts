import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { listPipelines, getPipeline, createPipeline, updatePipeline, deletePipeline } from './pipelines';

const okJson = (body: unknown) => Promise.resolve({
  ok: true,
  json: () => Promise.resolve(body),
} as Response);

const errJson = (status: number, body: unknown = {}) => Promise.resolve({
  ok: false,
  status,
  json: () => Promise.resolve(body),
} as Response);

describe('pipelines service', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const urlOf = () => String(fetchMock.mock.calls[0][0]);
  const optsOf = () => fetchMock.mock.calls[0][1] as RequestInit;

  it('listPipelines GETs the collection and unwraps { pipelines }', async () => {
    const pipelines = [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }];
    fetchMock.mockReturnValueOnce(okJson({ pipelines }));

    const result = await listPipelines('proj1');

    expect(result).toEqual(pipelines);
    expect(urlOf()).toContain('/streamby/projects/proj1/pipelines');
    expect(optsOf().method).toBe('GET');
    expect(optsOf().credentials).toBe('include');
  });

  it('getPipeline GETs one and unwraps { pipeline }', async () => {
    const pipeline = { id: 'p1', name: 'A' };
    fetchMock.mockReturnValueOnce(okJson({ pipeline }));

    const result = await getPipeline('proj1', 'p1');

    expect(result).toEqual(pipeline);
    expect(urlOf()).toContain('/streamby/projects/proj1/pipelines/p1');
    expect(optsOf().method).toBe('GET');
  });

  it('createPipeline POSTs the payload and unwraps { pipeline }', async () => {
    const pipeline = { id: 'p9', name: 'New' };
    fetchMock.mockReturnValueOnce(okJson({ pipeline }));

    const result = await createPipeline('proj1', { name: 'New' });

    expect(result).toEqual(pipeline);
    expect(urlOf()).toContain('/streamby/projects/proj1/pipelines');
    expect(optsOf().method).toBe('POST');
    expect(JSON.parse(optsOf().body as string)).toEqual({ name: 'New' });
  });

  it('updatePipeline PATCHes and unwraps { pipeline }', async () => {
    const pipeline = { id: 'p1', name: 'A', nodeSchema: { nodes: [], edges: [] } };
    fetchMock.mockReturnValueOnce(okJson({ pipeline }));

    const result = await updatePipeline('proj1', 'p1', { nodeSchema: { nodes: [], edges: [] } });

    expect(result).toEqual(pipeline);
    expect(urlOf()).toContain('/streamby/projects/proj1/pipelines/p1');
    expect(optsOf().method).toBe('PATCH');
  });

  it('deletePipeline DELETEs the pipeline', async () => {
    fetchMock.mockReturnValueOnce(okJson({ message: 'Pipeline deleted' }));

    await deletePipeline('proj1', 'p1');

    expect(urlOf()).toContain('/streamby/projects/proj1/pipelines/p1');
    expect(optsOf().method).toBe('DELETE');
  });

  it('throws with the server message on a non-ok response', async () => {
    fetchMock.mockReturnValueOnce(errJson(403, { message: 'Unauthorized' }));
    await expect(listPipelines('proj1')).rejects.toThrow('Unauthorized');
  });

  it('throws with the HTTP status when no message is returned', async () => {
    fetchMock.mockReturnValueOnce(errJson(500));
    await expect(getPipeline('proj1', 'p1')).rejects.toThrow('HTTP 500');
  });
});
