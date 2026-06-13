import { useState, useMemo, useEffect, useRef } from 'react';
import JsonViewer from '../JsonViewer/JsonViewer';
import { getConnectionResponse } from '../../../services/connections';
import { fetchRecords } from '../../../services/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import s from './ResponsePreview.module.css';
import type { FilterNodeConfig } from '../NodeViewer/NodeViewer';

// ─── Client-side filter execution (mirrors pipeline.ts applyFilterConfig) ──

function applyFilterConfig(payload: unknown, config: FilterNodeConfig): unknown {
  const isArr = Array.isArray(payload);
  let r: any = isArr ? [...(payload as any[])] : payload;

  if (config.conditions?.length) {
    const matches = (item: any) => config.conditions!.every(c => {
      const v = item?.[c.field];
      switch (c.op) {
        case 'eq':         return String(v) === c.value;
        case 'neq':        return String(v) !== c.value;
        case 'gt':         return Number(v) >  Number(c.value);
        case 'lt':         return Number(v) <  Number(c.value);
        case 'gte':        return Number(v) >= Number(c.value);
        case 'lte':        return Number(v) <= Number(c.value);
        case 'contains':   return String(v).includes(c.value);
        case 'startsWith': return String(v).startsWith(c.value);
        case 'endsWith':   return String(v).endsWith(c.value);
        default:           return true;
      }
    });
    r = isArr ? r.filter(matches) : (matches(r) ? r : null);
    if (r === null) return null;
  }

  if (config.includeFields?.length) {
    const pick = (item: any) => {
      if (!item || typeof item !== 'object') return item;
      const o: any = {};
      for (const f of config.includeFields!) if (f in item) o[f] = item[f];
      return o;
    };
    r = isArr ? r.map(pick) : pick(r);
  }

  if (config.renameFields?.length) {
    const ren = (item: any) => {
      if (!item || typeof item !== 'object') return item;
      const o = { ...item };
      for (const { from, to } of config.renameFields!) {
        if (from in o) { o[to] = o[from]; delete o[from]; }
      }
      return o;
    };
    r = isArr ? r.map(ren) : ren(r);
  }

  if (config.limit && isArr) r = r.slice(0, config.limit);
  if (config.wrapKey)        r = { [config.wrapKey]: r };
  return r;
}

function walkFilterChain(schema: { nodes: object[]; edges: object[] } | null | undefined, payload: unknown): unknown {
  if (!schema) return payload;
  const nodes = schema.nodes as SchemaNode[];
  const edges = schema.edges as SchemaEdge[];
  const findTarget = (srcId: string, srcHandle: string): SchemaNode | null => {
    const edge = edges.find(e => e.source === srcId && e.sourceHandle === srcHandle);
    return edge ? (nodes.find(n => n.id === edge.target) ?? null) : null;
  };
  let current = findTarget('streamby', 'out-right');
  let result = payload;
  while (current) {
    const cfg = current.data?.filterConfig as FilterNodeConfig | undefined;
    if (cfg) result = applyFilterConfig(result, cfg);
    current = findTarget(current.id, 'out-filter');
  }
  return result;
}

interface ResponsePreviewProps {
  projectId: string;
  schema: { nodes: object[]; edges: object[] } | null | undefined;
  savedApiResponse?: JSON | null;
  schemaVersion?: number;
}

type SchemaNode = { id: string; type?: string; data?: Record<string, unknown> };
type SchemaEdge = { source?: string; sourceHandle?: string; target?: string; targetHandle?: string };

const LIVE_TYPES = ['apiConnectionNode', 'dataSourceNode'];

function getIncomingNodes(schema: ResponsePreviewProps['schema']) {
  if (!schema) return [];
  const nodes = schema.nodes as SchemaNode[];
  const edges = schema.edges as SchemaEdge[];
  return edges
    .filter(e => e.target === 'streamby' && e.targetHandle === 'in-bottom')
    .map(e => nodes.find(n => n.id === e.source))
    .filter((n): n is SchemaNode => !!n);
}

function computeStaticResponse(schema: ResponsePreviewProps['schema']): unknown {
  const incoming = getIncomingNodes(schema);
  const values = incoming.flatMap(src => {
    if (src.type !== 'jsonInputNode') return [];
    try { return [JSON.parse((src.data?.jsonString as string) || '{}')] ; }
    catch { return []; }
  });
  if (values.length === 0) return null;
  const payload = values.length === 1 ? values[0] : values;
  return walkFilterChain(schema, payload);
}

async function simulateLiveResponse(
  schema: ResponsePreviewProps['schema'],
  projectId: string
): Promise<unknown> {
  const incoming = getIncomingNodes(schema);
  const results = await Promise.all(
    incoming.map(async src => {
      if (src.type === 'jsonInputNode') {
        try { return JSON.parse((src.data?.jsonString as string) || '{}'); }
        catch { return null; }
      }
      if (src.type === 'apiConnectionNode') {
        const connectionId = src.data?.connectionId as string;
        if (!connectionId) return null;
        return getConnectionResponse(projectId, connectionId);
      }
      if (src.type === 'dataSourceNode') {
        const connectionId = src.data?.connectionId as string;
        const tableName    = src.data?.tableName as string;
        const recordId     = src.data?.recordId   as string | undefined;
        if (!connectionId || !tableName) return null;
        const records = await fetchRecords(projectId, connectionId, tableName, 500);
        if (recordId) return (records as any[]).find((r: any) => String(r._id ?? r.id ?? '') === recordId) ?? null;
        return records;
      }
      return null;
    })
  );
  const values = results.filter(r => r !== null);
  if (values.length === 0) return null;
  const payload = values.length === 1 ? values[0] : values;
  return walkFilterChain(schema, payload);
}

export function ResponsePreview({ projectId, schema, savedApiResponse, schemaVersion = 0 }: ResponsePreviewProps) {
  const [liveResult, setLiveResult] = useState<unknown>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const prevSchemaRef = useRef<string>('');

  // schemaVersion is an integer counter that increments whenever edge topology changes.
  // Adding it as a dep alongside `schema` guarantees recomputation even if React
  // somehow reuses the same schema object reference across renders.
  const hasLiveNodes = useMemo(() => {
    const incoming = getIncomingNodes(schema);
    return incoming.some(n => LIVE_TYPES.includes(n.type ?? ''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, schemaVersion]);

  const staticResult = useMemo(
    () => computeStaticResponse(schema),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema, schemaVersion],
  );

  // Auto-refresh live nodes when schema changes (only if already fetched once)
  useEffect(() => {
    if (!hasLiveNodes || !hasFetched) return;
    const key = `${schemaVersion}:${JSON.stringify(schema)}`;
    if (key === prevSchemaRef.current) return;
    prevSchemaRef.current = key;
    setFetching(true);
    setFetchError(null);
    simulateLiveResponse(schema, projectId)
      .then(result => { setLiveResult(result); })
      .catch(err => { setFetchError((err as { message: string }).message || 'Preview failed.'); })
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, schemaVersion, hasLiveNodes, hasFetched, projectId]);

  const handlePreview = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const result = await simulateLiveResponse(schema, projectId);
      setLiveResult(result);
      setHasFetched(true);
    } catch (err: unknown) {
      setFetchError((err as { message: string }).message || 'Preview failed.');
    } finally {
      setFetching(false);
    }
  };

  // Use savedApiResponse only when there is no live schema (legacy exports without nodeSchema)
  const hasSchema     = schema != null;
  const displayResult = hasLiveNodes
    ? (hasFetched ? liveResult : (hasSchema ? null : (savedApiResponse as unknown ?? null)))
    : (staticResult ?? (hasSchema ? null : (savedApiResponse as unknown ?? null)));

  const emptyHint = hasLiveNodes
    ? 'Click Preview to simulate the backend response.'
    : hasSchema
      ? 'No data source connected to StreamBy.'
      : 'No response available.';

  return (
    <div className={s.root}>
      {hasLiveNodes && (
        <div className={s.fetchBar}>
          <span className={s.fetchHint}>
            Contains live connections — simulates the backend response.
          </span>
          <button
            type="button"
            className={`${s.fetchBtn} ${fetching ? s.fetchBtnLoading : ''}`}
            onClick={handlePreview}
            disabled={fetching}
          >
            <FontAwesomeIcon icon={faArrowsRotate} spin={fetching} />
            {fetching ? 'Computing…' : 'Preview Response'}
          </button>
        </div>
      )}

      {fetchError && <p className={s.error}>{fetchError}</p>}

      {displayResult != null
        ? <div className={s.viewer}><JsonViewer data={displayResult as JSON} /></div>
        : !fetchError && <p className={s.hint}>{emptyHint}</p>
      }
    </div>
  );
}
