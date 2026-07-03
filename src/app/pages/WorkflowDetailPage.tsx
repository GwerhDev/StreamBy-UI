import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setCurrentWorkflow, clearCurrentWorkflow, setWorkflowLoading, setWorkflowError } from '../../store/currentWorkflowSlice';
import { getWorkflow } from '../../services/workflows';
import { Spinner } from '../components/Spinner';
import { SectionHeader } from '../components/SectionHeader/SectionHeader';
import { ActionButton } from '../components/Buttons/ActionButton';
import { faSitemap, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

export function WorkflowDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId, workflowId } = useParams<{ id: string; workflowId: string }>();
  const { data: workflow, loading, error } = useSelector((state: RootState) => state.currentWorkflow);

  useEffect(() => {
    if (!projectId || !workflowId) return;
    if (workflow?.id === workflowId) return;
    dispatch(setWorkflowLoading());
    getWorkflow(projectId, workflowId)
      .then((data) => dispatch(setCurrentWorkflow(data)))
      .catch((err: Error) => dispatch(setWorkflowError(err.message || 'Failed to load workflow.')));
    return () => { dispatch(clearCurrentWorkflow()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, workflowId]);

  if (loading) return <Spinner bg isLoading />;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>{error}</div>;
  if (!workflow) return null;

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <SectionHeader
        icon={faSitemap}
        title={workflow.name}
        subtitle={workflow.description || 'No description'}
        action={
          <ActionButton
            icon={faPenToSquare}
            text="Edit pipeline"
            onClick={() => navigate(`/project/${projectId}/workflows/${workflowId}/editor`)}
          />
        }
      />
    </div>
  );
}
