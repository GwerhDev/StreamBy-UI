import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { setCurrentProject } from '../../store/currentProjectSlice';
import { addApiResponse } from '../../store/apiResponsesSlice';
import { getProjectWorkflow } from '../../services/workflow';
import { Workflow } from '../../interfaces';
import { WorkflowCanvas } from '../components/Workflow/WorkflowCanvas';
import { NodeSkeleton } from '../components/NodeViewer/NodeSkeleton';

// The project's workflow, as saved: it defines the project, so it's shown as it is, never
// rewritten on opening it.
export function WorkflowPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !currentProject?.id) return;
    let cancelled = false;
    setLoading(true);
    getProjectWorkflow(projectId)
      .then(wf => {
        if (cancelled) return;
        setWorkflow(wf);
        dispatch(setCurrentProject({ ...currentProject, workflow: wf }));
      })
      .catch(err => { if (!cancelled) dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to load the workflow.', type: 'error' })); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentProject?.id]);

  if (loading || !currentProject) return <NodeSkeleton />;
  if (!workflow) return null;
  return <WorkflowCanvas workflow={workflow} />;
}
