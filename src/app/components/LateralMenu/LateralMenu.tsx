import s from './LateralMenu.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArchive, faBox, faChevronDown, faDatabase, faDoorOpen, faGear, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardDirectoryList, databaseDirectoryList, settingsDirectoryList, storageDirectoryList } from '../../../config/consts';
import { CustomCanvas } from '../Canvas/CustomCanvas';
import { useState } from 'react';
import { archiveProject, unarchiveProject } from '../../../services/streamby';
import { useProjects } from '../../../hooks/useProjects';

export const LateralMenu = () => {
  const navigate = useNavigate();
  const { loadProjects, loadArchivedProjects } = useProjects();
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { name, id, members } = currentProject || {};
  const [showCanvas, setShowCanvas] = useState(false);

  const handleDeleteProjectModal = () => {
    const deleteProjectModal = document.getElementById("delete-project-modal") as HTMLDivElement | null;
    if (deleteProjectModal) deleteProjectModal.style.display = "flex";
  };

  const handleArchive = async () => {
    const response = await archiveProject(id);
    const { projects, archivedProjects } = response || {};
    loadProjects(projects);
    loadArchivedProjects(archivedProjects);
    navigate("/user/archive");
    setShowCanvas(false);
  };

  const handleUnarchive = async () => {
    const response = await unarchiveProject(id);
    const { projects, archivedProjects } = response || {};
    loadProjects(projects);
    loadArchivedProjects(archivedProjects);
    setShowCanvas(false);
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
            {
              members?.filter(m => m.userId === session.userId)?.[0].archived
                ?
                <li onClick={handleUnarchive} className={s.listButton}>
                  <FontAwesomeIcon icon={faArchive} />
                  Unarchive this project
                </li>
                :
                <li onClick={handleArchive} className={s.listButton}>
                  <FontAwesomeIcon icon={faArchive} />
                  Archive this project
                </li>
            }
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
