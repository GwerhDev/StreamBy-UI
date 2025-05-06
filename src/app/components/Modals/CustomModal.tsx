import s from "./CustomModal.module.css"
import { UpdateProjectForm } from "../Forms/UpdateProjectForm";

export const CustomModal = (props: any) => {
  const { children, id } = props || {};

  const closeModal = (id: string) => {
    const logoutModal = document.getElementById(id) as HTMLDivElement | null;
    if (logoutModal) {
      logoutModal.style.display = 'none';
    }
  };

  return (
    <div className={s.container} id={id}>
      {children}
    </div>
  )
}
