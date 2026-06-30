import { computeResponseFromSchema } from './nodeSchema';

const jsonNode = (jsonString: string) => ({
  id: 'json-1',
  type: 'jsonInputNode',
  data: { jsonString },
});

const streambyNode = { id: 'streamby', type: 'streambyNode', data: {} };

const edge = (source: string, sourceHandle: string, target: string, targetHandle: string) => ({
  source, sourceHandle, target, targetHandle,
});

describe('computeResponseFromSchema', () => {
  it('returns null for null schema', () => {
    expect(computeResponseFromSchema(null)).toBeNull();
  });

  it('returns null for undefined schema', () => {
    expect(computeResponseFromSchema(undefined)).toBeNull();
  });

  it('returns null when no nodes feed streamby in-bottom', () => {
    const schema = {
      nodes: [streambyNode, jsonNode('{"x":1}')],
      edges: [],
    };
    expect(computeResponseFromSchema(schema)).toBeNull();
  });

  it('returns the parsed JSON from a single jsonInputNode connected to in-bottom', () => {
    const schema = {
      nodes: [streambyNode, jsonNode('{"name":"Alice"}')],
      edges: [edge('json-1', 'out-right', 'streamby', 'in-bottom')],
    };
    expect(computeResponseFromSchema(schema)).toEqual({ name: 'Alice' });
  });

  it('wraps multiple JSON sources in an array', () => {
    const schema = {
      nodes: [
        streambyNode,
        { id: 'j1', type: 'jsonInputNode', data: { jsonString: '{"a":1}' } },
        { id: 'j2', type: 'jsonInputNode', data: { jsonString: '{"b":2}' } },
      ],
      edges: [
        edge('j1', 'out-right', 'streamby', 'in-bottom'),
        edge('j2', 'out-right', 'streamby', 'in-bottom'),
      ],
    };
    const result = computeResponseFromSchema(schema) as unknown[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ a: 1 });
    expect(result).toContainEqual({ b: 2 });
  });

  it('returns null when jsonInputNode has invalid JSON', () => {
    const schema = {
      nodes: [streambyNode, jsonNode('NOT JSON')],
      edges: [edge('json-1', 'out-right', 'streamby', 'in-bottom')],
    };
    expect(computeResponseFromSchema(schema)).toBeNull();
  });

  it('ignores non-jsonInputNode sources', () => {
    const schema = {
      nodes: [
        streambyNode,
        { id: 'db-1', type: 'dataSourceNode', data: { tableName: 'users' } },
      ],
      edges: [edge('db-1', 'out-stream', 'streamby', 'in-bottom')],
    };
    expect(computeResponseFromSchema(schema)).toBeNull();
  });

  it('returns value when json is an array', () => {
    const schema = {
      nodes: [streambyNode, jsonNode('[1,2,3]')],
      edges: [edge('json-1', 'out-right', 'streamby', 'in-bottom')],
    };
    expect(computeResponseFromSchema(schema)).toEqual([1, 2, 3]);
  });
});
