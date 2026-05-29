import { useState, useMemo, useEffect, useRef } from 'react';
import JsonViewer from '../JsonViewer/JsonViewer';
import { getConnectionResponse } from '../../../services/connections';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import s from './ResponsePreview.module.css';

interface ResponsePreviewProps {
  projectId: string;
  schema: { nodes: object[]; edges: object[] } | null | undefined;
  savedApiResponse?: JSON | null;
  schemaVersion?: number;
}

type SchemaNode = { id: string; type?: string; data?: Record<string, unknown> };
type SchemaEdge = { source?: string; target?: string; targetHandle?: string };

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
  return values.length === 1 ? values[0] : values;
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
      return null;
    })
  );
  const values = results.filter(r => r !== null);
  if (values.length === 0) return null;
  return values.length === 1 ? values[0] : values;
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
