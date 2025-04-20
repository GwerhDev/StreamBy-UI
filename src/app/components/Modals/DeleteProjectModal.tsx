import s from './DeleteProjectModal.module.css';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faRightFromBracket, faXmark } from '@fortawesome/free-solid-svg-icons';
import { deleteProject } from '../../../services/streamby';

export const DeleteProjectModal = (props: any) => {
  const { project } = props || {};
  const navigate = useNavigate();

  const handleDeleteProject = async () => {
    await deleteProject(project.id).then(() => {
      const logoutModal = document.getElementById('delete-project-modal') as HTMLDivElement | null;
      if (logoutModal) {
        logoutModal.style.display = 'none';
      }
      navigate('/');
    });
  };

  const handleCancel = () => {
    const logoutModal = document.getElementById('delete-project-modal') as HTMLDivElement | null;
    if (logoutModal) {
      logoutModal.style.display = 'none';
    }
  };

  return (
    <div className={s.container} id='delete-project-modal'>
      <form className={s.modalForm} action="">
        <h2>Delete {project.name}?</h2>
        <p>Confirm that you want to delete this project</p>
        <ul className={s.buttonContainer}>
          <PrimaryButton icon={faRightFromBracket} onClick={handleDeleteProject} text='Delete' type='button' />
          <SecondaryButton icon={faXmark} onClick={handleCancel} text='Cancel' type='button' />
        </ul>
      </form>
    </div>
  );
};
