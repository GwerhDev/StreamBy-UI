import s from './DeleteProjectModal.module.css';
import { useNavigate } from 'react-router-dom';
import { deleteProject } from '../../../services/projects';
import { useProjects } from '../../../hooks/useProjects';
import { FormEvent, useState } from 'react';
import { DeleteProjectForm } from '../Forms/DeleteProjectForm';
import { Project } from '../../../interfaces';

interface DeleteProjectModalProps {
  currentProject: Project | null;
}

export const DeleteProjectModal = (props: DeleteProjectModalProps) => {
  const [loader, setLoader] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [confirmText, setConfirmText] = useState<string>("");
  const { currentProject } = props || {};
  const { loadProjects } = useProjects();
  const navigate = useNavigate();

  const handleDeleteProject = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      const response = await deleteProject(currentProject?.id);
      loadProjects(response.projects);
      setLoader(false);
    } catch (error) {
      setLoader(false);
      console.error('Error deleting project:', error);
    }
    const logoutModal = document.getElementById('delete-project-modal') as HTMLDivElement | null;
    if (logoutModal) logoutModal.style.display = 'none';
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
    setConfirmText(value);
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
        confirmText={confirmText}
      />
    </div>
  );
};