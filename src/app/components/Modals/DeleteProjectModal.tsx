import s from './DeleteProjectModal.module.css';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurrentProjectState } from '../../../interfaces';
import { deleteProject } from '../../../services/projects';
import { DeleteProjectForm } from '../Forms/DeleteProjectForm';
import { ModalShell } from './ModalShell';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';

interface DeleteProjectModalProps {
  currentProject: CurrentProjectState | null;
}

export const DeleteProjectModal = (props: DeleteProjectModalProps) => {
  const [loader, setLoader] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [confirmText, setConfirmText] = useState<string>('');
  const { currentProject } = props;
  const navigate = useNavigate();

  const handleDeleteProject = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      await deleteProject(currentProject?.data?.id);
      handleCancel();
      navigate('/');
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setLoader(false);
    }
  };

  const handleCancel = () => {
    const modal = document.getElementById('delete-project-modal') as HTMLDivElement | null;
    if (modal) modal.style.display = 'none';
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setConfirmText(value);
    setDisabled(value !== currentProject?.data?.name);
  };

  return (
    <div className={s.container} id="delete-project-modal">
      <ModalShell
        title={`Delete ${currentProject?.data?.name ?? 'Project'}?`}
        onClose={handleCancel}
        footer={
          <>
            <SecondaryButton disabled={loader} icon={faXmark} onClick={handleCancel} text="Cancel" />
            <PrimaryButton
              type="submit"
              form="delete-project-form"
              disabled={disabled || loader}
              icon={faTrash}
              text="Delete"
            />
          </>
        }
      >
        <DeleteProjectForm
          currentProject={currentProject}
          handleDeleteProject={handleDeleteProject}
          handleCancel={handleCancel}
          handleInput={handleInput}
          disabled={disabled}
          loader={loader}
          confirmText={confirmText}
        />
      </ModalShell>
    </div>
  );
};
