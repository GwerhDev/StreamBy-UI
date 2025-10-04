import s from './DeleteCredentialModal.module.css';
import { deleteCredential } from '../../../services/projects';
import { FormEvent, useState } from 'react';
import { DeleteCredentialForm } from '../Forms/DeleteCredentialForm';

interface Credential {
  id: string;
  key: string;
  value: string;
}

interface DeleteCredentialModalProps {
  projectId: string | undefined;
  credentialId: string | undefined;
  currentCredential: Credential | undefined;
  onClose: () => void;
}

export const DeleteCredentialModal = (props: DeleteCredentialModalProps) => {
  const [loader, setLoader] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [confirmText, setConfirmText] = useState<string>("");
  const { projectId, credentialId, currentCredential, onClose } = props || {};

  const handleDeleteCredential = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      await deleteCredential(projectId || '', credentialId || '');
      setLoader(false);
      onClose();
    } catch (error) {
      setLoader(false);
      console.error('Error deleting credential:', error);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setConfirmText(value);
    if (value === currentCredential?.key) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  };

  return (
    <div className={s.container}>
      <DeleteCredentialForm
        loader={loader}
        disabled={disabled}
        confirmText={confirmText}
        currentCredential={currentCredential}
        handleInput={handleInput}
        handleCancel={handleCancel}
        handleDeleteCredential={handleDeleteCredential}
      />
    </div>
  );
};
