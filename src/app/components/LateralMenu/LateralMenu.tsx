import s from './LateralMenu.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArchive, faBox, faChevronDown, faDatabase, faDoorOpen, faGear, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Link } from 'react-router-dom';
import { dashboardDirectoryList, databaseDirectoryList, settingsDirectoryList, storageDirectoryList } from '../../../config/consts';
import { CustomCanvas } from '../Canvas/CustomCanvas';
import { useState } from 'react';

export const LateralMenu = () => {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const [showCanvas, setShowCanvas] = useState(false);
  const { name, id } = currentProject || {};

  const handleDeleteProjectModal = () => {
    const deleteProjectModal = document.getElementById("delete-project-modal") as HTMLDivElement | null;
    if (deleteProjectModal) deleteProjectModal.style.display = "flex";
  };

  return (
    <div className={s.container}>
      <div className={s.titleButton}>
        <span className={s.title} onClick={() => setShowCanvas(true)}>
          <h4>
            {name}
          </h4>
          <FontAwesomeIcon icon={faChevronDown} />
        </span>
        <CustomCanvas showCanvas={showCanvas} setShowCanvas={setShowCanvas}>
          <ul className={s.projectActionsContainer}>
            <li className={s.listButton}>
              <FontAwesomeIcon icon={faArchive} />
              Archive this project
            </li>
            <li className={s.listButton}>
              <FontAwesomeIcon icon={faDoorOpen} />
              Abandon this project
            </li>
            <li>
              <button onClick={handleDeleteProjectModal} className={s.deleteButton}>
                <FontAwesomeIcon icon={faTrash} />
                Delete this project
              </button>
            </li>
          </ul>
        </CustomCanvas>
      </div>
      <div className={s.outterMenuContainer}>
        <div className={s.menuContainer}>
          <div className={s.mainMenu}>
            <h5>MAIN MENU</h5>
            <span className={s.section}>
              <Link to={`/project/${id}/dashboard`}>
                <h4>DASHBOARD</h4>
              </Link>
              <FontAwesomeIcon icon={faTableColumns} />
            </span>
          </div>
          <ul className={s.menuList}>
            {
              dashboardDirectoryList.map(({ name, icon, path }, index) =>
                <Link key={index} to={`/project/${id}/${path}`}>
                  <li>
                    {icon && <FontAwesomeIcon icon={icon} />}
                    {name}
                  </li>
                </Link>
              )
            }
          </ul>

          <span className={s.section}>
            <Link to={`/project/${id}/storage`}>
              <h4>STORAGE</h4>
            </Link>
            <FontAwesomeIcon icon={faBox} />
          </span>
          <ul className={s.menuList}>
            {
              storageDirectoryList.map(({ name, icon, path }, index) =>
                <Link key={index} to={`/project/${id}/${path}`}>
                  <li>
                    {icon && <FontAwesomeIcon icon={icon} />}
                    {name}
                  </li>
                </Link>
              )
            }
          </ul>

          <span className={s.section}>
            <Link to={`/project/${id}/database`}>
              <h4>DATABASE</h4>
            </Link>
            <FontAwesomeIcon icon={faDatabase} />
          </span>
          <ul className={s.menuList}>
            {
              databaseDirectoryList.map(({ name, icon, path }, index) =>
                <Link key={index} to={`/project/${id}/${path}`}>
                  <li>
                    {icon && <FontAwesomeIcon icon={icon} />}
                    {name}
                  </li>
                </Link>
              )
            }
          </ul>

          <span className={s.section}>
            <Link to={`/project/${id}/settings`}>
              <h4>SETTINGS</h4>
            </Link>
            <FontAwesomeIcon icon={faGear} />
          </span>
          <ul className={s.menuList}>
            {
              settingsDirectoryList.map(({ name, icon, path }, index) =>
                <Link key={index} to={`/project/${id}/${path}`}>
                  <li>
                    {icon && <FontAwesomeIcon icon={icon} />}
                    {name}
                  </li>
                </Link>
              )
            }
          </ul>
        </div>
      </div>
    </div >
  )
}
