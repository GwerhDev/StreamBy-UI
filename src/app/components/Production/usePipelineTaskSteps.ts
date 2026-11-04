import { useEffect, useState } from 'react';
import { getPipeline } from '../../../services/pipelines';

export interface TaskStep { id: string; label: string }

const NONE: TaskStep[] = [];

// The Tasks steps of a card's pipeline: what its tasks may be part of.
export function usePipelineTaskSteps(projectId: string, pipelineId: string | null): TaskStep[] {
  const [steps, setSteps] = useState<TaskStep[]>(NONE);
  useEffect(() => {
    if (!pipelineId) { setSteps(NONE); return; }
    let cancelled = false;
    getPipeline(projectId, pipelineId)
      .then(pipeline => {
        if (cancelled) return;
        const nodes = (pipeline.nodeSchema?.nodes ?? []) as { id: string; type?: string; data?: { label?: string } }[];
        setSteps(nodes.filter(n => n.type === 'tasksNode').map(n => ({ id: n.id, label: n.data?.label || 'Tasks' })));
      })
      .catch(() => { if (!cancelled) setSteps(NONE); });
    return () => { cancelled = true; };
  }, [projectId, pipelineId]);
  return steps;
}
