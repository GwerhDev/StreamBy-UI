import s from "./EditProjectModal.module.css"
import { UpdateProjectForm } from "../Forms/UpdateProjectForm";

export const EditProjectModal = (props: any) => {
  const { currentProject } = props || {};

  const closeModal = () => {
    const logoutModal = document.getElementById('edit-project-modal') as HTMLDivElement | null;
    if (logoutModal) {
      logoutModal.style.display = 'none';
    }
  };

  return (
    <div className={s.container} id='edit-project-modal'>
      <UpdateProjectForm currentProject={currentProject} closeModal={closeModal} />
    </div>
  )
}
