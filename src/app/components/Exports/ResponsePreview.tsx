import { useState } from 'react';
import JsonViewer from '../JsonViewer/JsonViewer';
import { computeResponseFromSchema } from '../NodeViewer/NodeViewer';
import { previewExport } from '../../../services/exports';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import s from './ResponsePreview.module.css';

interface ResponsePreviewProps {
  projectId: string;
  exportName: string;
  schema: { nodes: object[]; edges: object[] } | null | undefined;
  savedApiResponse?: JSON | null;
}

type LiveNode = { id: string; type?: string };
type LiveEdge = { source?: string; targetHandle?: string; target?: string };

function hasLiveConnections(schema: ResponsePreviewProps['schema']): boolean {
  if (!schema) return false;
  const liveTypes = ['apiConnectionNode', 'dataSourceNode'];
  const liveNodeIds = (schema.nodes as LiveNode[])
    .filter(n => liveTypes.includes(n.type ?? ''))
    .map(n => n.id);
  return (schema.edges as LiveEdge[]).some(
    e => liveNodeIds.includes(e.source ?? '') && e.target === 'streamby' && e.targetHandle === 'in-bottom'
  );
}

export function ResponsePreview({ projectId, exportName, schema, savedApiResponse }: ResponsePreviewProps) {
  const [liveResult, setLiveResult] = useState<unknown>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const needsFetch = hasLiveConnections(schema);
  const computedResult = needsFetch ? null : computeResponseFromSchema(schema);

  const handleFetch = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const result = await previewExport(projectId, exportName);
      setLiveResult(result);
    } catch (err: unknown) {
      setFetchError((err as { message: string }).message || 'Fetch failed.');
    } finally {
      setFetching(false);
    }
  };

  // Priority: live fetched → saved from DB → computed from JSON nodes
  const displayResult = liveResult ?? (savedApiResponse as unknown) ?? computedResult;

  return (
    <div className={s.root}>
      {needsFetch && (
        <div className={s.fetchBar}>
          <span className={s.fetchHint}>
            Contains live connections — fetch to preview the actual response.
          </span>
          <button
            type="button"
            className={`${s.fetchBtn} ${fetching ? s.fetchBtnLoading : ''}`}
            onClick={handleFetch}
            disabled={fetching}
          >
            <FontAwesomeIcon icon={faArrowsRotate} spin={fetching} />
            {fetching ? 'Fetching…' : 'Fetch Response'}
          </button>
        </div>
      )}

      {fetchError && <p className={s.error}>{fetchError}</p>}

      {displayResult != null
        ? <div className={s.viewer}><JsonViewer data={displayResult as JSON} /></div>
        : !fetchError && (
          <p className={s.hint}>
            {needsFetch
              ? 'No response yet — click Fetch to preview.'
              : 'No processed response available.'}
          </p>
        )
      }
    </div>
  );
}
