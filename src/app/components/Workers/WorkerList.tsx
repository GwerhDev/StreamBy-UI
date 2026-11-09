import s from './WorkerList.module.css';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGears, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { deleteWorker, setRunnerAutoKind } from '../../../services/workers';
import { clearWorkersError, fetchWorkers, removeWorker, setWorkerAutoKind } from '../../../store/workersSlice';
import { Worker } from '../../../interfaces';
import { ResourceList } from '../ResourceList/ResourceList';
import { ModalShell } from '../Modals/ModalShell';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { useOpenForm } from '../../../hooks/useFormRoute';
import { DropdownInput } from '../Inputs/DropdownInput';

// The processing workers the project can use: the host's and the runners shared with it
// (read-only here: a runner's owner shares it), and its own.
const SOURCE_BADGE: Record<Worker['source'], string> = { builtin: 'Host', project: 'Project', runner: 'Runner' };

export const WorkerList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const openForm = useOpenForm();
  const { id: projectId = '' } = useParams<{ id: string }>();
  const workers = useSelector((state: RootState) => (state.workers.projectId === projectId ? state.workers.list : null));
  // Only the project's admins choose what a runner runs by itself.
  const isAdmin = useSelector((state: RootState) =>
    state.currentProject?.data?.members?.find(m => m.userId === state.session?.userId)?.role === 'admin');
  const [toRemove, setToRemove] = useState<Worker | null>(null);
  const [removing, setRemoving] = useState(false);

  // Fresh each time the page is opened (the menu may have loaded them a while ago).
  useEffect(() => {
    dispatch(fetchWorkers(projectId));
  }, [dispatch, projectId]);

  // A failed load is told here, whoever asked for it (the menu may have, at once).
  const loadError = useSelector((state: RootState) => (state.workers.projectId === projectId ? state.workers.error : null));
  useEffect(() => {
    if (loadError) dispatch(addApiResponse({ message: loadError, type: 'error' }));
  }, [dispatch, loadError]);
  useEffect(() => () => { dispatch(clearWorkersError()); }, [dispatch]);

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

  const handleAutoKind = async (worker: Worker, value: string) => {
    const autoKind = value || null;
    try {
      const saved = await setRunnerAutoKind(projectId, worker.id, autoKind);
      dispatch(setWorkerAutoKind({ source: 'runner', id: worker.id, autoKind: saved }));
      dispatch(addApiResponse({
        message: saved ? `${worker.name} runs ${saved} on deliverables by itself.` : `${worker.name} runs nothing by itself.`, type: 'success',
      }));
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : "Failed to set the runner's automatic kind.", type: 'error' }));
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
            <span className={s.badge}>{SOURCE_BADGE[worker.source]}</span>
            {worker.source === 'runner' && (
              <span className={`${s.state} ${worker.online ? s.online : ''}`} data-testid={`worker-state-${worker.id}`}>
                {worker.online ? 'Online' : 'Offline'}
              </span>
            )}
          </span>
          <small className={s.detail}>
            {worker.kinds.join(', ') || 'Not said yet'}{worker.categories.length > 0 && ` · ${worker.categories.join(', ')}`}
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
    ) : worker.source === 'runner' && isAdmin && worker.kinds.length > 0 ? (
      <span className={s.autoKind} data-testid={`worker-auto-kind-${worker.id}`} title="What it runs by itself on deliverables">
        <DropdownInput
          value={worker.autoKind ?? ''}
          options={[{ value: '', label: 'Nothing by itself' }, ...worker.kinds.map(kind => ({ value: kind, label: `Runs ${kind}` }))]}
          onChange={value => handleAutoKind(worker, value)}
          dropdownMinWidth={180}
        />
      </span>
    ) : undefined,
  }));

  return (
    <>
      <ResourceList
        icon={faGears}
        title="Workers"
        subtitle="External services, and runners shared with the project, that process its assets (optimizing models, making LODs...). An offline runner's jobs wait for it."
        items={items}
        loading={workers === null}
        layout="grid"
        onAdd={() => openForm(`/project/${projectId}/workers/create`)}
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
