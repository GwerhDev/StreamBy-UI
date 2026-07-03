import s from './WorkflowList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { Workflow } from '../../../interfaces';
import { getWorkflows, createWorkflow } from '../../../services/workflows';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSitemap } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from '../Buttons/ActionButton';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';

export function WorkflowList() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: currentProjectData, loading: projectLoading } = useSelector((state: RootState) => state.currentProject);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getWorkflows(projectId)
      .then(setWorkflows)
      .catch(() => setWorkflows([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleCreate = async () => {
    if (!projectId) return;
    setCreating(true);
    try {
      const workflow: Workflow = await createWorkflow(projectId, { name: 'New Workflow' });
      if (currentProjectData) {
        dispatch(setCurrentProject({
          ...currentProjectData,
          workflows: [...(currentProjectData.workflows ?? []), workflow],
        }));
      }
      navigate(`/project/${projectId}/workflows/${workflow.id}/editor`);
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to create workflow.', type: 'error' }));
    } finally {
      setCreating(false);
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
          <ActionButton icon={faPlus} text="New workflow" onClick={handleCreate} />
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
              <div>
                <div className={s.cardName}>{wf.name}</div>
                {wf.description && <div className={s.cardMeta}>{wf.description}</div>}
              </div>
              <span className={`${s.statusBadge} ${wf.status === 'active' ? s.statusActive : s.statusDraft}`}>
                {wf.status}
              </span>
            </div>
          ))}
          <div className={`${s.card} ${s.createCard}`} onClick={handleCreate}>
            <FontAwesomeIcon icon={faPlus} />
            <span>{creating ? 'Creating…' : 'New workflow'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
