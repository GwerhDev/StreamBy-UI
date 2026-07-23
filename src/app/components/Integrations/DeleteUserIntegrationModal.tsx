import s from './DeleteUserIntegrationModal.module.css';
import { FormEvent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { LabeledInput } from '../Inputs/LabeledInput';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { deleteUserIntegration } from '../../../services/userIntegrations';
import { removeIntegration } from '../../../store/managementSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { AppDispatch } from '../../../store';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      await deleteUserIntegration(integrationId);
      dispatch(addApiResponse({ message: 'Integration deleted.', type: 'success' }));
      dispatch(removeIntegration(integrationId));
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
