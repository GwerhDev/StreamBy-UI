import s from './LateralMenu.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarsProgress, faBox, faBoxesStacked, faChevronDown, faCubes, faDatabase, faDiagramProject, faFingerprint, faGear, faHeadphones, faImage, faShield, faTableColumns, faTowerBroadcast, faTrash, faVideo } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Link } from 'react-router-dom';

export const LateralMenu = () => {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { name, id } = currentProject || {};

  const handleDeleteProjectModal = () => {
    const deleteProjectModal = document.getElementById("delete-project-modal") as HTMLDivElement | null;
    if (deleteProjectModal) deleteProjectModal.style.display = "flex";
  };

  return (
    <div className={s.container}>
      <button className={s.titleButton}>
        <h3>
          {name}
        </h3>
        <FontAwesomeIcon icon={faChevronDown} />
      </button>
      <div className={s.outterMenuContainer}>
        <div className={s.menuContainer}>
          <div className={s.mainMenu}>
            <h5>MAIN MENU</h5>
            <span className={s.section}>
              <h4>DASHBOARD</h4>
              <FontAwesomeIcon icon={faTableColumns} />
            </span>
          </div>
          <ul className={s.menuList}>
            <Link to={`/project/${id}/dashboard/overview`}>
              <li>
                <FontAwesomeIcon icon={faDiagramProject} />
                Overview
              </li>
            </Link>
          </ul>

          <span className={s.section}>
            <h4>STORAGE</h4>
            <FontAwesomeIcon icon={faBox} />
          </span>
          <ul className={s.menuList}>
            <Link to={`/project/${id}/storage/images`}>
              <li>
                <FontAwesomeIcon icon={faImage} />
                Images
              </li>
            </Link>

            <Link to={`/project/${id}/storage/audios`}>
              <li>
                <FontAwesomeIcon icon={faHeadphones} />
                Audios
              </li>
            </Link>

            <Link to={`/project/${id}/storage/videos`}>
              <li>
                <FontAwesomeIcon icon={faVideo} />
                Videos
              </li>
            </Link>

            <Link to={`/project/${id}/storage/3dmodels`}>
              <li>
                <FontAwesomeIcon icon={faCubes} />
                3D Models
              </li>
            </Link>
          </ul>

          <span className={s.section}>
            <h4>DATABASE</h4>
            <FontAwesomeIcon icon={faDatabase} />
          </span>
          <ul className={s.menuList}>
            <li>
              <FontAwesomeIcon icon={faBoxesStacked} />
              Collections
            </li>
            <li>
              <FontAwesomeIcon icon={faBarsProgress} />
              Records
            </li>
            <li>
              <FontAwesomeIcon icon={faTowerBroadcast} />
              Connections
            </li>
          </ul>

          <span className={s.section}>
            <h4>SETTINGS</h4>
            <FontAwesomeIcon icon={faGear} />
          </span>
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
