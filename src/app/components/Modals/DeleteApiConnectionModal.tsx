import s from './DeleteApiConnectionModal.module.css';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { LabeledInput } from '../Inputs/LabeledInput';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { deleteApiConnection } from '../../../services/connections';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { RootState } from '../../../store';
import { ModalShell } from './ModalShell';

interface DeleteApiConnectionModalProps {
  projectId: string;
  connectionId: string;
  connectionName: string;
  onClose: () => void;
}

export const DeleteApiConnectionModal = ({ projectId, connectionId, connectionName, onClose }: DeleteApiConnectionModalProps) => {
  const [loader, setLoader] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    try {
      setLoader(true);
      const response = await deleteApiConnection(projectId, connectionId);
      dispatch(addApiResponse({ message: response.message || 'API connection deleted.', type: 'success' }));
      dispatch(setCurrentProject({
        ...currentProject,
        apiConnections: currentProject.apiConnections?.filter(c => c.id !== connectionId) ?? [],
      }));
      onClose();
      navigate(`/project/${projectId}/connections/api`);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete connection.', type: 'error' }));
    } finally {
      setLoader(false);
    }
  };

  return (
    <ModalShell title={`Delete ${connectionName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className={s.container}>
        <p>Confirm that you want to delete this connection</p>
        <LabeledInput
          type="text"
          onChange={e => setConfirmText(e.target.value)}
          label={`Enter "${connectionName}" to submit`}
          name="confirm-delete"
          value={confirmText}
          id="confirm-delete"
          htmlFor="confirm-delete"
          placeholder=""
        />
        <div className={s.buttonContainer}>
          <PrimaryButton type="submit" disabled={confirmText !== connectionName || loader} icon={faTrash} text="Delete" />
          <SecondaryButton disabled={loader} icon={faXmark} onClick={onClose} text="Cancel" />
        </div>
      </form>
    </ModalShell>
  );
};
