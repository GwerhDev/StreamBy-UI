import s from './LateralMenu.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faChevronDown, faDatabase, faGear, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Link } from 'react-router-dom';
import { dashboardDirectoryList, databaseDirectoryList, settingsDirectoryList, storageDirectoryList } from '../../../config/consts';

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
        <h4>
          {name}
        </h4>
        <FontAwesomeIcon icon={faChevronDown} />
      </button>
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
          <button onClick={handleDeleteProjectModal} className={s.deleteButton}>
            <FontAwesomeIcon icon={faTrash} />
            Delete this project
          </button>
        </div>
      </div>
    </div >
  )
}
