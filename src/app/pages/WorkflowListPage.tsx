import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { setCurrentProject } from '../../store/currentProjectSlice';
import { addApiResponse } from '../../store/apiResponsesSlice';
import { createWorkflow } from '../../services/workflows';
import { WorkflowList } from '../components/Workflows/WorkflowList';

export function WorkflowListPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const [creating, setCreating] = useState(false);

  const workflows = currentProject?.workflows ?? [];

  useEffect(() => {
    if (!currentProject || !projectId || workflows.length > 0 || creating) return;
    setCreating(true);
    createWorkflow(projectId, { name: 'Architecture', description: 'Project architecture overview' })
      .then(created => {
        dispatch(setCurrentProject({ ...currentProject, workflows: [created] }));
        navigate(`/project/${projectId}/workflows/${created.id}`, { replace: true });
      })
      .catch(err => dispatch(addApiResponse({ message: err.message || 'Failed to create workflow', type: 'error' })))
      .finally(() => setCreating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, workflows.length]);

  return <WorkflowList />;
}
