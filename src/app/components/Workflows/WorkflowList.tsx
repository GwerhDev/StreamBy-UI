import s from './WorkflowList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSitemap, faTrash } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { Workflow } from '../../../interfaces';
import { getWorkflows, deleteWorkflow } from '../../../services/workflows';
import { ActionButton } from '../Buttons/ActionButton';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ModalShell } from '../Modals/ModalShell';

export function WorkflowList() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: currentProjectData, loading: projectLoading } = useSelector((state: RootState) => state.currentProject);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getWorkflows(projectId)
      .then(setWorkflows)
      .catch(() => setWorkflows([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleDeleteConfirm = async () => {
    if (!projectId || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWorkflow(projectId, deleteTarget.id);
      const updated = workflows.filter(w => w.id !== deleteTarget.id);
      setWorkflows(updated);
      if (currentProjectData) {
        dispatch(setCurrentProject({
          ...currentProjectData,
          workflows: (currentProjectData.workflows ?? []).filter(w => w.id !== deleteTarget.id),
        }));
      }
      dispatch(addApiResponse({ message: 'Workflow deleted.', type: 'success' }));
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to delete workflow.', type: 'error' }));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const isLoading = loading || projectLoading;

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faSitemap}
        title="Workflows"
        subtitle="Design your internal project pipeline"
        action={isLoading ? undefined : (
          <ActionButton icon={faPlus} text="New workflow" onClick={() => navigate(`/project/${projectId}/workflows/create`)} />
        )}
      />

      {isLoading ? (
        <div className={s.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${s.skeletonItem} ${skeleton.skeleton}`} />
          ))}
        </div>
      ) : !workflows.length ? (
        <div className={s.emptyState}>
          <EmptyBackground />
        </div>
      ) : (
        <div className={s.grid}>
          {workflows.map(wf => (
            <div
              key={wf.id}
              className={s.card}
              onClick={() => navigate(`/project/${projectId}/workflows/${wf.id}`)}
            >
              <div className={s.cardInfo}>
                <div className={s.cardName}>{wf.name}</div>
                {wf.description && <div className={s.cardMeta}>{wf.description}</div>}
              </div>
              <div className={s.cardRight}>
                <span className={`${s.statusBadge} ${wf.status === 'active' ? s.statusActive : s.statusDraft}`}>
                  {wf.status}
                </span>
                <button
                  type="button"
                  className={s.deleteBtn}
                  onClick={e => { e.stopPropagation(); setDeleteTarget(wf); }}
                  title="Delete workflow"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ModalShell title="Delete workflow" icon={faTrash} onClose={() => setDeleteTarget(null)}>
          <div className={s.confirmBody}>
            <p className={s.confirmText}>
              Delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className={s.confirmActions}>
              <button type="button" className={s.dangerBtn} disabled={deleting} onClick={handleDeleteConfirm}>
                {deleting ? 'Deleting…' : 'Delete workflow'}
              </button>
              <button type="button" className={s.cancelBtn} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
