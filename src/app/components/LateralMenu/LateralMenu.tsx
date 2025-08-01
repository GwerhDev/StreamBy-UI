import s from './LateralMenu.module.css';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArchive, faBox, faChevronDown, faDatabase, faDoorOpen, faGear, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { dashboardDirectoryList, databaseDirectoryList, settingsDirectoryList, storageDirectoryList } from '../../../config/consts';
import { RootState } from '../../../store';
import { useProjects } from '../../../hooks/useProjects';
import { archiveProject, unarchiveProject, fetchProject } from '../../../services/projects';
import { CustomCanvas } from '../Canvas/CustomCanvas';
import { setCurrentProject } from '../../../store/currentProjectSlice';

export const LateralMenu = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loadProjects } = useProjects();
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { name, id, members } = currentProject.data || {};
  const [showCanvas, setShowCanvas] = useState(false);

  const handleDeleteProjectModal = () => {
    const deleteProjectModal = document.getElementById("delete-project-modal") as HTMLDivElement | null;
    if (deleteProjectModal) deleteProjectModal.style.display = "flex";
  };

  const handleArchive = async () => {
    const response = await archiveProject(id || '');
    const { projects } = response || {};
    loadProjects(projects);
    navigate("/user/archive");
    setShowCanvas(false);
  };

  const handleUnarchive = async () => {
    const response = await unarchiveProject(id || '');
    const { projects } = response || {};
    loadProjects(projects);
    const updatedProject = await fetchProject(id, navigate);
    if (updatedProject) {
      dispatch(setCurrentProject(updatedProject));
    }
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
              members?.filter((m: { userId: string; }) => m.userId === session.userId)?.[0].archived
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
            <span className={`${s.section} ${location.pathname.startsWith(`/project/${id}/dashboard`) ? s.activeLink : ''}`}>
              <Link to={`/project/${id}/dashboard`}>
                <h4>DASHBOARD</h4>
              </Link>
              <FontAwesomeIcon icon={faTableColumns} />
            </span>
          </div>
          
          <ul className={s.menuList}>
            {
              dashboardDirectoryList.map(({ name, icon, path }, index) => {
                const linkPath = `/project/${id}/${path}`;
                const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                return (
                  <Link key={index} to={linkPath}>
                    <li className={isActive ? s.activeLink : ''}>
                      {icon && <FontAwesomeIcon icon={icon} />}
                      {name}
                    </li>
                  </Link>
                );
              })
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
              storageDirectoryList.map(({ name, icon, path }, index) => {
                const linkPath = `/project/${id}/${path}`;
                const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                return (
                  <Link key={index} to={linkPath}>
                    <li className={isActive ? s.activeLink : ''}>
                      {icon && <FontAwesomeIcon icon={icon} />}
                      {name}
                    </li>
                  </Link>
                );
              })
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
              databaseDirectoryList.map(({ name, icon, path }, index) => {
                const linkPath = `/project/${id}/${path}`;
                const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                return (
                  <Link key={index} to={linkPath}>
                    <li className={isActive ? s.activeLink : ''}>
                      {icon && <FontAwesomeIcon icon={icon} />}
                      {name}
                    </li>
                  </Link>
                );
              })
            }
          </ul>

          <span className={`${s.section} ${location.pathname.startsWith(`/project/${id}/settings`) ? s.activeLink : ''}`}>
            <Link to={`/project/${id}/settings`}>
              <h4>SETTINGS</h4>
            </Link>
            <FontAwesomeIcon icon={faGear} />
          </span>
          <ul className={s.menuList}>
            {
              settingsDirectoryList.map(({ name, icon, path }, index) => {
                const linkPath = `/project/${id}/${path}`;
                const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                return (
                  <Link key={index} to={linkPath}>
                    <li className={isActive ? s.activeLink : ''}>
                      {icon && <FontAwesomeIcon icon={icon} />}
                      {name}
                    </li>
                  </Link>
                );
              })
            }
          </ul>
        </div>
      </div>
    </div >
  )
}
