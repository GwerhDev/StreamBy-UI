import s from './LateralMenu.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCubes, faDiagramProject, faFingerprint, faHeadphones, faImage, faShield, faTrash, faVideo } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

export const LateralMenu = () => {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { name } = currentProject || {};

  const handleDeleteProjectModal = () => {
    const deleteProjectModal = document.getElementById("delete-project-modal") as HTMLDivElement | null;
    if (deleteProjectModal) deleteProjectModal.style.display = "flex";
  };

  return (
    <div className={s.container}>
      <button className={s.titleButton}>
        {name}
        <FontAwesomeIcon icon={faChevronDown} />
      </button>
      <div className={s.outterMenuContainer}>
        <div className={s.menuContainer}>
          <div className={s.mainMenu}>
            <h6>MAIN MENU</h6>
            <h4>DASHBOARD</h4>
          </div>
          <ul className={s.menuList}>
            <li>
              <FontAwesomeIcon icon={faDiagramProject} />
              Overview
            </li>
          </ul>
          <h4>STORAGE</h4>
          <ul className={s.menuList}>
            <li>
              <FontAwesomeIcon icon={faImage} />
              Image
            </li>
            <li>
              <FontAwesomeIcon icon={faHeadphones} />
              Audio
            </li>
            <li>
              <FontAwesomeIcon icon={faVideo} />
              Video
            </li>
            <li>
              <FontAwesomeIcon icon={faCubes} />
              3D Models
            </li>
          </ul>
          <h4>SETTINGS</h4>
          <ul className={s.menuList}>
            <li>
              <FontAwesomeIcon icon={faFingerprint} />
              Credentials
            </li>
            <li>
              <FontAwesomeIcon icon={faShield} />
              Permissions
            </li>
          </ul>
          <button onClick={handleDeleteProjectModal} className={s.deleteButton}>
            <FontAwesomeIcon icon={faTrash} />
            Delete this project
          </button>
        </div>
      </div>
    </div >
  )
}
