import s from './WorkflowDetail.module.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { faSitemap, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentWorkflow, clearCurrentWorkflow, setWorkflowLoading, setWorkflowError } from '../../../store/currentWorkflowSlice';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { getWorkflow, deleteWorkflow } from '../../../services/workflows';
import { Spinner } from '../Spinner';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { ModalShell } from '../Modals/ModalShell';

export function WorkflowDetail() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId, workflowId } = useParams<{ id: string; workflowId: string }>();
  const { data: workflow, loading, error } = useSelector((state: RootState) => state.currentWorkflow);
  const currentProjectData = useSelector((state: RootState) => state.currentProject.data);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!projectId || !workflowId) return;
    setDeleting(true);
    try {
      await deleteWorkflow(projectId, workflowId);
      if (currentProjectData) {
        dispatch(setCurrentProject({
          ...currentProjectData,
          workflows: (currentProjectData.workflows ?? []).filter(w => w.id !== workflowId),
        }));
      }
      dispatch(clearCurrentWorkflow());
      dispatch(addApiResponse({ message: 'Workflow deleted.', type: 'success' }));
      navigate(`/project/${projectId}/workflows`);
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to delete workflow.', type: 'error' }));
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading || !workflow) return <Spinner bg isLoading />;
  if (error) return <div className={s.error}>{error}</div>;

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faSitemap}
        title={workflow.name}
        subtitle={workflow.description || 'No description'}
        action={
          <div className={s.actions}>
            <ActionButton
              icon={faPenToSquare}
              text="Edit"
              onClick={() => navigate(`/project/${projectId}/workflows/${workflowId}/edit`)}
            />
            <ActionButton
              icon={faSitemap}
              text="Open editor"
              onClick={() => navigate(`/project/${projectId}/workflows/${workflowId}/editor`)}
            />
            <SecondaryButton
              icon={faTrash}
              text="Delete"
              onClick={() => setShowDeleteConfirm(true)}
            />
          </div>
        }
      />

      {showDeleteConfirm && (
        <ModalShell title="Delete workflow" icon={faTrash} onClose={() => setShowDeleteConfirm(false)}>
          <div className={s.confirmBody}>
            <p className={s.confirmText}>
              Delete <strong>{workflow.name}</strong>? This action cannot be undone.
            </p>
            <div className={s.confirmActions}>
              <button type="button" className={s.dangerBtn} disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting…' : 'Delete workflow'}
              </button>
              <button type="button" className={s.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
