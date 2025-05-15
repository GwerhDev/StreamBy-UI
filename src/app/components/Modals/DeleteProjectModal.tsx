import s from './DeleteProjectModal.module.css';
import { useNavigate } from 'react-router-dom';
import { deleteProject, fetchProjects } from '../../../services/streamby';
import { useProjects } from '../../../hooks/useProjects';
import { FormEvent, useState } from 'react';
import { DeleteProjectForm } from '../Forms/DeleteProjectForm';

export const DeleteProjectModal = (props: any) => {
  const [loader, setLoader] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const { currentProject } = props || {};
  const { loadProjects } = useProjects();
  const navigate = useNavigate();

  const handleDeleteProject = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      await deleteProject(currentProject?.id);
      await fetchProjects().then((response) => loadProjects(response)).finally(() => navigate('/'));
      setLoader(false);
    } catch (error) {
      setLoader(false);
      console.error('Error deleting project:', error);
    }
    const logoutModal = document.getElementById('delete-project-modal') as HTMLDivElement | null;
    if (logoutModal) logoutModal.style.display = 'none';
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
      <DeleteProjectForm
        currentProject={currentProject}
        handleDeleteProject={handleDeleteProject}
        handleCancel={handleCancel}
        handleInput={handleInput}
        disabled={disabled}
        loader={loader}
      />
    </div>
  );
};
