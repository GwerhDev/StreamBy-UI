import s from './DeleteProjectModal.module.css';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { deleteProject, fetchProjects } from '../../../services/streamby';
import { useProjects } from '../../../hooks/useProjects';
import { useState } from 'react';

export const DeleteProjectModal = (props: any) => {
  const [loader, setLoader] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const { currentProject } = props || {};
  const { loadProjects } = useProjects();
  const navigate = useNavigate();

  const handleDeleteProject = async (e: any) => {
    e.preventDefault();
    try {
      setLoader(true);
      await deleteProject(currentProject?.id);
      setLoader(false);
    } catch (error) {
      setLoader(false);
      console.error('Error deleting project:', error);
    }
    const logoutModal = document.getElementById('delete-project-modal') as HTMLDivElement | null;
    if (logoutModal) logoutModal.style.display = 'none';
    const projects = await fetchProjects();
    loadProjects(projects);
    navigate('/');
  };

  const handleCancel = () => {
    const logoutModal = document.getElementById('delete-project-modal') as HTMLDivElement | null;
    if (logoutModal) {
      logoutModal.style.display = 'none';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value === currentProject?.name) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  };

  return (
    <div className={s.container} id='delete-project-modal'>
      <form className={s.modalForm} action="">
        <h2>Delete {currentProject?.name}?</h2>
        <form className={s.buttonContainer}>
          <p>Confirm that you want to delete this project entering <strong>{currentProject?.name}</strong></p>
          <input type="text" onInput={handleInput} />

          <PrimaryButton disabled={disabled || loader} icon={faTrash} onClick={handleDeleteProject} text='Delete' type='button' />
          <SecondaryButton disabled={loader} icon={faXmark} onClick={handleCancel} text='Cancel' type='button' />
        </form>
      </form>
    </div>
  );
};
