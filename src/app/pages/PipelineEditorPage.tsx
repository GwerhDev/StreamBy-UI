import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch } from '../../store';
import { addApiResponse } from '../../store/apiResponsesSlice';
import { setCurrentPipeline, clearCurrentPipeline } from '../../store/currentPipelineSlice';
import { getPipeline } from '../../services/pipelines';
import { Pipeline } from '../../interfaces';
import { PipelineCanvas } from '../components/Workflow/PipelineCanvas';
import { NodeSkeleton } from '../components/NodeViewer/NodeSkeleton';

export function PipelineEditorPage() {
  const { id: projectId, pipelineId } = useParams<{ id: string; pipelineId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !pipelineId) return;

    let cancelled = false;
    setLoading(true);

    getPipeline(projectId, pipelineId)
      .then(p => {
        if (cancelled) return;
        setPipeline(p);
        dispatch(setCurrentPipeline(p));
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load pipeline';
        if (!cancelled) dispatch(addApiResponse({ message, type: 'error' }));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      dispatch(clearCurrentPipeline());
    };
  }, [projectId, pipelineId, dispatch]);

  if (loading) return <NodeSkeleton />;
  if (!pipeline) return null;

  return <PipelineCanvas pipeline={pipeline} onChange={setPipeline} />;
}
