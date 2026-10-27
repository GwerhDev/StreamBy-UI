import s from './WorkerList.module.css';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGears, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { deleteWorker } from '../../../services/workers';
import { fetchWorkers, removeWorker } from '../../../store/workersSlice';
import { Worker } from '../../../interfaces';
import { ResourceList } from '../ResourceList/ResourceList';
import { ModalShell } from '../Modals/ModalShell';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

// The processing workers the project can use: the host's (read-only here) and its own.
export const WorkerList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId = '' } = useParams<{ id: string }>();
  const workers = useSelector((state: RootState) => (state.workers.projectId === projectId ? state.workers.list : null));
  const [toRemove, setToRemove] = useState<Worker | null>(null);
  const [removing, setRemoving] = useState(false);

  // Fresh each time the page is opened (the menu may have loaded them a while ago).
  useEffect(() => {
    dispatch(fetchWorkers(projectId)).unwrap().catch(err =>
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to load workers.', type: 'error' })));
  }, [dispatch, projectId]);

  const handleRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    try {
      await deleteWorker(projectId, toRemove.id);
      dispatch(addApiResponse({ message: `${toRemove.name} removed.`, type: 'success' }));
      dispatch(removeWorker(toRemove.id));
      setToRemove(null);
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to remove the worker.', type: 'error' }));
    } finally {
      setRemoving(false);
    }
  };

  const items: { id: string; title?: string; card: React.ReactNode; actions?: React.ReactNode }[] = (workers ?? []).map(worker => ({
    id: `${worker.source}-${worker.id}`,
    title: worker.name,
    card: (
      <span className={s.card} data-testid={`worker-${worker.id}`}>
        <span className={s.iconContainer}><FontAwesomeIcon icon={faGears} /></span>
        <span className={s.info}>
          <span className={s.titleRow}>
            <h4 className={s.name}>{worker.name}</h4>
            <span className={s.badge}>{worker.source === 'builtin' ? 'Host' : 'Project'}</span>
          </span>
          <small className={s.detail}>
            {worker.kinds.join(', ')} · {worker.categories.join(', ')}
            {worker.autoKind && ` · runs ${worker.autoKind} on deliverables`}
          </small>
        </span>
      </span>
    ),
    actions: worker.source === 'project' ? (
      <button
        type="button" className={s.deleteButton} title="Remove worker" aria-label={`Remove ${worker.name}`}
        onClick={e => { e.stopPropagation(); setToRemove(worker); }}
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    ) : undefined,
  }));

  return (
    <>
      <ResourceList
        icon={faGears}
        title="Workers"
        subtitle="External services that process the project's assets (optimizing models, making LODs...)."
        items={items}
        loading={workers === null}
        layout="grid"
        onAdd={() => navigate(`/project/${projectId}/workers/create`)}
        addLabel="Connect a worker"
      />
      {toRemove && (
        <ModalShell title={`Remove ${toRemove.name}`} onClose={() => setToRemove(null)}>
          <div className={s.modalBody}>
            <p>Its jobs already done are kept; it won't be sent new ones.</p>
            <div className={s.modalActions}>
              <PrimaryButton type="button" disabled={removing} icon={faTrash} text="Remove" onClick={handleRemove} />
              <SecondaryButton disabled={removing} icon={faXmark} text="Cancel" onClick={() => setToRemove(null)} />
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
};
