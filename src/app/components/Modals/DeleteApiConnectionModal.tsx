import s from './DeleteApiConnectionModal.module.css';
import form from '../Forms/DeleteProjectForm.module.css';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { LabeledInput } from '../Inputs/LabeledInput';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { deleteApiConnection } from '../../../services/apiConnections';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { RootState } from '../../../store';

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
      await deleteApiConnection(projectId, connectionId);
      dispatch(setCurrentProject({
        ...currentProject,
        apiConnections: currentProject.apiConnections?.filter(c => c.id !== connectionId) ?? [],
      }));
      onClose();
      navigate(`/project/${projectId}/connections/api`);
    } catch (error) {
      console.error('Error deleting api connection:', error);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={form.container}>
        <h2>Delete {connectionName}?</h2>
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
        <div className={form.buttonContainer}>
          <PrimaryButton type="submit" disabled={confirmText !== connectionName || loader} icon={faTrash} text="Delete" />
          <SecondaryButton disabled={loader} icon={faXmark} onClick={onClose} text="Cancel" />
        </div>
      </form>
    </div>
  );
};
