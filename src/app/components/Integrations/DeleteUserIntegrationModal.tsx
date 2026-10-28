import s from './DeleteUserIntegrationModal.module.css';
import { FormEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { LabeledInput } from '../Inputs/LabeledInput';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { deleteUserIntegration, getUserIntegrationDependents, IntegrationDependent } from '../../../services/userIntegrations';
import { setProjectResource } from '../../../store/currentProjectSlice';
import { removeIntegration } from '../../../store/managementSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { AppDispatch, RootState } from '../../../store';
import { ModalShell } from '../Modals/ModalShell';

interface DeleteUserIntegrationModalProps {
  integrationId: string;
  integrationName: string;
  onClose: () => void;
}

export const DeleteUserIntegrationModal = ({ integrationId, integrationName, onClose }: DeleteUserIntegrationModalProps) => {
  const [loader, setLoader] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  // The projects' connections that use it: they're disconnected with it.
  const [dependents, setDependents] = useState<IntegrationDependent[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getUserIntegrationDependents(integrationId)
      .then(found => { if (!cancelled) setDependents(found); })
      .catch(() => { if (!cancelled) setDependents([]); });
    return () => { cancelled = true; };
  }, [integrationId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      const { affected } = await deleteUserIntegration(integrationId);
      dispatch(addApiResponse({ message: 'Integration deleted.', type: 'success' }));
      dispatch(removeIntegration(integrationId));
      // The project being seen, if it used it: its connections as the server has them now.
      const lists = affected.find(a => a.projectId === currentProject?.id);
      if (lists) {
        for (const key of ['dbConnections', 'storageConnections', 'integrationConnections'] as const) {
          dispatch(setProjectResource({ projectId: lists.projectId, key, value: lists[key] as never }));
        }
      }
      onClose();
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete integration.', type: 'error' }));
    } finally {
      setLoader(false);
    }
  };

  return (
    <ModalShell title={`Delete ${integrationName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className={s.container}>
        <p>Confirm that you want to delete this integration</p>
        {dependents === null ? (
          <p className={s.muted}>Checking which projects use it…</p>
        ) : dependents.length ? (
          <div className={s.dependents} data-testid="integration-dependents">
            <p>These project connections use it, and are disconnected with it:</p>
            <ul>{dependents.map(d => <li key={`${d.projectId}-${d.connectionId}`}>{d.projectName}: {d.name}</li>)}</ul>
          </div>
        ) : (
          <p className={s.muted} data-testid="integration-dependents-none">No project uses it.</p>
        )}
        <LabeledInput
          type="text"
          onChange={e => setConfirmText(e.target.value)}
          label={`Enter "${integrationName}" to submit`}
          name="confirm-delete"
          value={confirmText}
          id="confirm-delete"
          htmlFor="confirm-delete"
          placeholder=""
        />
        <div className={s.buttonContainer}>
          <PrimaryButton type="submit" disabled={confirmText !== integrationName || loader} icon={faTrash} text="Delete" />
          <SecondaryButton disabled={loader} icon={faXmark} onClick={onClose} text="Cancel" />
        </div>
      </form>
    </ModalShell>
  );
};
