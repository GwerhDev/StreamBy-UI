import s from './LateralMenu.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

export const LateralMenu = () => {

  const handleDeleteProjectModal = () => {
    const deleteProjectModal = document.getElementById("delete-project-modal") as HTMLDivElement | null;
    if (deleteProjectModal) deleteProjectModal.style.display = "flex";
  };

  return (
    <div className={s.container}>
      <div className={s.mainMenu}>
        <h6>MAIN MENU</h6>
        <h4>DASHBOARD</h4>
      </div>
      <ul className={s.menuList}>
        <li>
          Overview
        </li>
      </ul>
      <h4>STORAGE</h4>
      <ul className={s.menuList}>
        <li>
          Image
        </li>
        <li>
          Audio
        </li>
        <li>
          Video
        </li>
        <li>
          3D Models
        </li>
      </ul>
      <h4>SETTINGS</h4>
      <ul className={s.menuList}>
        <li>
          Credentials
        </li>
        <li>
          Permissions
        </li>
      </ul>
      <button onClick={handleDeleteProjectModal} className={s.deleteButton}>
        <FontAwesomeIcon icon={faTrash} />
        Delete this project
      </button>
    </div>
  )
}
