import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { setCurrentProject } from '../../store/currentProjectSlice';
import { createWorkflow } from '../../services/workflows';
import { ProjectArchitecture } from '../components/Workflows/ProjectArchitecture';

export function WorkflowListPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const workflows = currentProject?.workflows ?? [];
  const overview = workflows[0] ?? null;

  useEffect(() => {
    if (!currentProject || !projectId || overview || creating) return;
    setCreating(true);
    createWorkflow(projectId, { name: 'Architecture', description: 'Project architecture overview' })
      .then(created => {
        dispatch(setCurrentProject({ ...currentProject, workflows: [created] }));
      })
      .catch(err => setError(err.message || 'Failed to initialize workflow'))
      .finally(() => setCreating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, overview]);

  if (error) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>{error}</div>;
  if (!overview) return null;

  return <ProjectArchitecture workflow={overview} />;
}
