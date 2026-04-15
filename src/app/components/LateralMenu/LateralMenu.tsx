import s from './LateralMenu.module.css';
import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArchive, faBox, faChevronDown, faCloud, faCode, faDatabase, faDoorOpen, faGear, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { apiDirectoryList, dashboardDirectoryList, databaseDirectoryList, settingsDirectoryList, storageDirectoryList } from '../../../config/consts';
import { RootState } from '../../../store';
import { useProjects } from '../../../hooks/useProjects';
import { archiveProject, unarchiveProject, fetchProject } from '../../../services/projects';
import { CustomCanvas } from '../Canvas/CustomCanvas';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { CloudStorage } from '../../../interfaces';

const MENU_MIN_WIDTH = 160;
const MENU_MAX_WIDTH = 480;
const MENU_DEFAULT_WIDTH = 250;

export const LateralMenu = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loadProjects } = useProjects();
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const storages = useSelector((state: RootState) => state.management.storages);
  const { name, id, members } = currentProject.data || {};
  const [showCanvas, setShowCanvas] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);
  const [expandedStorages, setExpandedStorages] = useState<Set<string>>(new Set());

  const toggleStorage = (value: string) => {
    setExpandedStorages(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [menuWidth, setMenuWidth] = useLocalStorage<number>('streamby-menu-width', MENU_DEFAULT_WIDTH);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = menuWidth;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(startWidth + e.clientX - startX, MENU_MIN_WIDTH), MENU_MAX_WIDTH);
      setMenuWidth(newWidth);
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

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
    <div className={s.wrapper} style={isSmallScreen ? undefined : { width: `${menuWidth}px` }}>
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
            <div className={s.storageList}>
              {storages.map((storage: CloudStorage) => {
                const isExpanded = expandedStorages.has(storage.value);
                const linkPath = `/project/${id}/storage/${storage.value}`;
                const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);

                return (
                  <React.Fragment key={storage.value}>
                    <div className={`${s.serviceHeader} ${isActive ? s.activeLink : ''}`}>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`${s.serviceChevron} ${isExpanded ? s.serviceChevronOpen : ''}`}
                        onClick={() => toggleStorage(storage.value)}
                      />
                      <Link to={linkPath} className={s.serviceName}>
                        <FontAwesomeIcon icon={faCloud} className={s.serviceIcon} />
                        <span>{storage.name}</span>
                      </Link>
                    </div>
                    {isExpanded && storageDirectoryList.map(({ name, icon, path }, index) => {
                      const linkPath = `/project/${id}/storage/${storage.value}/${path}`;
                      const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                      return (
                        <Link key={index} to={linkPath}>
                          <div className={`${s.storageItem} ${isActive ? s.activeLink : ''}`}>
                            {icon && <FontAwesomeIcon icon={icon} />}
                            {name}
                          </div>
                        </Link>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>

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

            <span className={s.section}>
              <Link to={`/project/${id}/api`}>
                <h4>API</h4>
              </Link>
              <FontAwesomeIcon icon={faCode} />
            </span>
            <ul className={s.menuList}>
              {
                apiDirectoryList.map(({ name, icon, path }, index) => {
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
      </div>
      {!isSmallScreen && <div className={s.resizeHandle} onMouseDown={handleResizeMouseDown} />}
    </div>
  );
}
