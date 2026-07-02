import s from './LateralMenu.module.css';
import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArchive, faBox, faChevronDown, faCloud, faDatabase, faDoorOpen, faGear, faTableColumns, faTowerBroadcast, faTrash } from '@fortawesome/free-solid-svg-icons';
import { apiDirectoryList, dashboardDirectoryList, settingsDirectoryList, storageDirectoryList } from '../../../config/consts';
import { fetchTables, fetchBuiltinDatabases } from '../../../services/database';
import { DbConnection, CloudStorage } from '../../../interfaces';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { archiveProject, unarchiveProject } from '../../../services/projects';
import { setProjects } from '../../../store/projectsSlice';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { CustomCanvas } from '../Canvas/CustomCanvas';
import { useEditorMenu } from '../../../context/EditorMenuContext';

const MENU_MIN_WIDTH = 160;
const MENU_MAX_WIDTH = 480;
const MENU_DEFAULT_WIDTH = 250;

export const LateralMenu = ({ children }: { children?: React.ReactNode } = {}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const session = useSelector((state: RootState) => state.session);
  const mode = session.mode ?? 'developer';
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const storages = useSelector((state: RootState) => state.management.storages);
  const { name, id, members } = currentProject.data || {};
  const selfMember = members?.find(m => m.userId === session.userId);
  const isPending = selfMember?.status === 'pending';
  const [showCanvas, setShowCanvas] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);
  const [expandedStorages, setExpandedStorages] = useState<Set<string>>(new Set());
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
  const [dbTables, setDbTables] = useState<Record<string, string[]>>({});
  const [dbTablesLoading, setDbTablesLoading] = useState<Set<string>>(new Set());
  const { menuOpen, closeMenu } = useEditorMenu();
  const location = useLocation();

  const isDashboardSection = location.pathname.includes(`/project/${id}/dashboard`);
  const isStorageSection = location.pathname.includes(`/project/${id}/storage`);
  const isDatabaseSection = location.pathname.includes(`/project/${id}/database`);
  const isConnectionsSection = location.pathname.includes(`/project/${id}/connections`);
  const isSettingsSection = location.pathname.includes(`/project/${id}/settings`);

  const [sectionOpen, setSectionOpen] = useState({
    dashboard: isDashboardSection,
    storage: isStorageSection,
    database: isDatabaseSection,
    connections: isConnectionsSection,
    settings: isSettingsSection,
  });

  useEffect(() => {
    setSectionOpen(prev => ({
      dashboard: prev.dashboard || isDashboardSection,
      storage: prev.storage || isStorageSection,
      database: prev.database || isDatabaseSection,
      connections: prev.connections || isConnectionsSection,
      settings: prev.settings || isSettingsSection,
    }));
  }, [isDashboardSection, isStorageSection, isDatabaseSection, isConnectionsSection, isSettingsSection]);

  const toggleSection = (key: keyof typeof sectionOpen) => {
    setSectionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const isEditorRoute = location.pathname.endsWith('/editor');
    if (isEditorRoute) {
      closeMenu();
    }
  }, [location]);

  const toggleStorage = (value: string) => {
    setExpandedStorages(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const [builtinDbs, setBuiltinDbs] = useState<{ name: string; value: string }[]>([]);

  useEffect(() => {
    setExpandedDbs(new Set());
    setDbTables({});
    setDbTablesLoading(new Set());
    if (id) fetchBuiltinDatabases().then(setBuiltinDbs);
  }, [id]);

  const builtinDbConns: DbConnection[] = builtinDbs.map(db => ({
    id: db.name,
    name: db.name,
    dbType: db.value === 'sql' ? 'postgresql' : 'mongodb',
    credentialId: '',
    projectId: id ?? '',
    isBuiltin: true,
  }));
  const externalDbConns: DbConnection[] = currentProject.data?.dbConnections ?? [];
  const allDbConns = [...builtinDbConns, ...externalDbConns];

  const toggleDb = async (connId: string) => {
    const willExpand = !expandedDbs.has(connId);
    setExpandedDbs(prev => {
      const next = new Set(prev);
      if (next.has(connId)) next.delete(connId);
      else next.add(connId);
      return next;
    });
    if (willExpand && !dbTables[connId]) {
      setDbTablesLoading(prev => new Set([...prev, connId]));
      const tables = await fetchTables(id || '', connId);
      setDbTables(prev => ({ ...prev, [connId]: tables }));
      setDbTablesLoading(prev => { const s = new Set(prev); s.delete(connId); return s; });
    }
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
    try {
      const response = await archiveProject(id || '');
      dispatch(addApiResponse({ message: response.message || 'Project archived.', type: 'success' }));
      if (response.projects) dispatch(setProjects(response.projects));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to archive project.', type: 'error' }));
    }
    navigate("/user/archive");
    setShowCanvas(false);
  };

  const handleUnarchive = async () => {
    try {
      const response = await unarchiveProject(id || '');
      dispatch(addApiResponse({ message: response.message || 'Project unarchived.', type: 'success' }));
      if (response.projects) dispatch(setProjects(response.projects));
      const current = currentProject.data;
      if (current && current.id && current.id === id) {
        dispatch(setCurrentProject({
          ...current,
          id: current.id,
          members: current.members?.map(m =>
            m.userId === session.userId ? { ...m, archived: false } : m
          ) ?? [],
        }));
      }
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to unarchive project.', type: 'error' }));
    }
    setShowCanvas(false);
  };

  const menuContent = (
    <div className={s.wrapper} style={!menuOpen ? { display: 'none' } : { width: `${menuWidth}px` }}>
      <div className={s.container}>
        {children ? (
          <div className={s.outterMenuContainer}>
            <div className={s.menuContainer}>{children}</div>
          </div>
        ) : (<>
        <div className={s.titleButton}>
          <span className={s.title} onClick={() => setShowCanvas(true)}>
            <h4>{name}</h4>
            <FontAwesomeIcon icon={faChevronDown} />
          </span>
          <CustomCanvas showCanvas={showCanvas} setShowCanvas={setShowCanvas}>
            <ul className={s.projectActionsContainer}>
              {selfMember?.archived ? (
                <li onClick={handleUnarchive} className={s.listButton}>
                  <FontAwesomeIcon icon={faArchive} />
                  Unarchive this project
                </li>
              ) : (
                <li onClick={handleArchive} className={s.listButton}>
                  <FontAwesomeIcon icon={faArchive} />
                  Archive this project
                </li>
              )}
              <li onClick={() => {}} className={s.listButton}>
                <FontAwesomeIcon icon={faDoorOpen} />
                Abandon this project
              </li>
              <li onClick={handleDeleteProjectModal} className={`${s.listButton} ${s.deleteButton}`}>
                <FontAwesomeIcon icon={faTrash} />
                Delete this project
              </li>
            </ul>
          </CustomCanvas>
        </div>
        <div className={s.outterMenuContainer}>
          <div className={s.menuContainer}>

            {/* DASHBOARD */}
            <div className={s.accordionSection}>
              <div className={`${s.sectionHeader} ${isDashboardSection ? s.sectionHeaderActive : ''}`} onClick={() => toggleSection('dashboard')}>
                <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate(`/project/${id}/dashboard`); }}>
                  <FontAwesomeIcon icon={faTableColumns} className={s.sectionIcon} />
                  Dashboard
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`${s.sectionChevron} ${sectionOpen.dashboard ? s.sectionChevronOpen : ''}`}
                />
              </div>
              {sectionOpen.dashboard && (
                <div className={s.sectionBody}>
                  {isPending ? (
                    <Link
                      to={`/preview/${id}`}
                      className={`${s.navItem} ${location.pathname.startsWith(`/preview/${id}`) ? s.activeLink : ''}`}
                    >
                      Preview
                    </Link>
                  ) : (
                    dashboardDirectoryList.map(({ name, icon, path }, index) => {
                      const linkPath = `/project/${id}/${path}`;
                      const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                      return (
                        <Link key={index} to={linkPath} className={`${s.navItem} ${isActive ? s.activeLink : ''}`}>
                          {icon && <FontAwesomeIcon icon={icon} />}
                          {name}
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {!isPending && (<>

              {/* STORAGE */}
              <div className={s.accordionSection}>
                <div className={`${s.sectionHeader} ${isStorageSection ? s.sectionHeaderActive : ''}`} onClick={() => toggleSection('storage')}>
                  <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate(`/project/${id}/storage`); }}>
                    <FontAwesomeIcon icon={faBox} className={s.sectionIcon} />
                    Storage
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`${s.sectionChevron} ${sectionOpen.storage ? s.sectionChevronOpen : ''}`}
                  />
                </div>
                {sectionOpen.storage && (
                  <div className={s.sectionBody}>
                    {[
                      ...storages.map((storage: CloudStorage, i: number) => ({
                        id: i === 0 ? 'builtin' : `builtin-${i}`,
                        name: storage.name,
                      })),
                      ...(currentProject.data?.storageConnections ?? []),
                    ].map(conn => {
                      const isExpanded = expandedStorages.has(conn.id);
                      const linkPath = `/project/${id}/storage/${conn.id}`;
                      const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                      return (
                        <React.Fragment key={conn.id}>
                          <Link to={linkPath} className={`${s.serviceHeader} ${isActive ? s.activeLink : ''}`}>
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className={`${s.serviceChevron} ${isExpanded ? s.serviceChevronOpen : ''}`}
                              onClick={e => { e.preventDefault(); e.stopPropagation(); toggleStorage(conn.id); }}
                            />
                            <FontAwesomeIcon icon={faCloud} className={s.serviceIcon} />
                            <span className={s.serviceName}>{conn.name}</span>
                          </Link>
                          {isExpanded && storageDirectoryList.map(({ name, icon, path }, index) => {
                            const catPath = `/project/${id}/storage/${conn.id}/${path}`;
                            const isCatActive = location.pathname === catPath || location.pathname.startsWith(`${catPath}/`);
                            return (
                              <Link key={index} to={catPath} className={`${s.storageItem} ${isCatActive ? s.activeLink : ''}`}>
                                {icon && <FontAwesomeIcon icon={icon} />}
                                {name}
                              </Link>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DATABASE — Developer only */}
              {mode === 'developer' && <div className={s.accordionSection}>
                <div className={`${s.sectionHeader} ${isDatabaseSection ? s.sectionHeaderActive : ''}`} onClick={() => toggleSection('database')}>
                  <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate(`/project/${id}/database`); }}>
                    <FontAwesomeIcon icon={faDatabase} className={s.sectionIcon} />
                    Database
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`${s.sectionChevron} ${sectionOpen.database ? s.sectionChevronOpen : ''}`}
                  />
                </div>
                {sectionOpen.database && (
                  <div className={s.sectionBody}>
                    {allDbConns.map(conn => {
                      const isExpanded = expandedDbs.has(conn.id);
                      const connPath = `/project/${id}/database/${conn.id}`;
                      const isActive = location.pathname === connPath || location.pathname.startsWith(`${connPath}/`);
                      const tables = dbTables[conn.id] || [];
                      const isLoading = dbTablesLoading.has(conn.id);
                      return (
                        <React.Fragment key={conn.id}>
                          <Link to={connPath} state={{ dbType: conn.dbType, isBuiltin: conn.isBuiltin, name: conn.name }} className={`${s.serviceHeader} ${isActive ? s.activeLink : ''}`}>
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className={`${s.serviceChevron} ${isExpanded ? s.serviceChevronOpen : ''}`}
                              onClick={e => { e.preventDefault(); e.stopPropagation(); toggleDb(conn.id); }}
                            />
                            <FontAwesomeIcon icon={faDatabase} className={s.serviceIcon} />
                            <span className={s.serviceName}>{conn.name}</span>
                          </Link>
                          {isExpanded && (
                            isLoading ? (
                              <div className={`${s.storageItem} ${s.storageItemLoading}`}>Loading…</div>
                            ) : tables.length === 0 ? (
                              <div className={`${s.storageItem} ${s.storageItemMuted}`}>No tables</div>
                            ) : tables.map(tableName => {
                              const tablePath = `${connPath}/${encodeURIComponent(tableName)}`;
                              return (
                                <Link key={tableName} to={tablePath} state={{ dbType: conn.dbType, isBuiltin: conn.isBuiltin, name: conn.name }}
                                  className={`${s.storageItem} ${location.pathname === tablePath ? s.activeLink : ''}`}>
                                  <FontAwesomeIcon icon={faTableColumns} />
                                  {tableName}
                                </Link>
                              );
                            })
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>}

              {/* CONNECTIONS — Developer only */}
              {mode === 'developer' && <div className={s.accordionSection}>
                <div className={`${s.sectionHeader} ${isConnectionsSection ? s.sectionHeaderActive : ''}`} onClick={() => toggleSection('connections')}>
                  <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate(`/project/${id}/connections`); }}>
                    <FontAwesomeIcon icon={faTowerBroadcast} className={s.sectionIcon} />
                    Connections
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`${s.sectionChevron} ${sectionOpen.connections ? s.sectionChevronOpen : ''}`}
                  />
                </div>
                {sectionOpen.connections && (
                  <div className={s.sectionBody}>
                    {apiDirectoryList.map(({ name, icon, path }, index) => {
                      const linkPath = `/project/${id}/${path}`;
                      const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                      return (
                        <Link key={index} to={linkPath} className={`${s.navItem} ${isActive ? s.activeLink : ''}`}>
                          {icon && <FontAwesomeIcon icon={icon} />}
                          {name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>}

              {/* SETTINGS — Developer only */}
              {mode === 'developer' && <div className={s.accordionSection}>
                <div className={`${s.sectionHeader} ${isSettingsSection ? s.sectionHeaderActive : ''}`} onClick={() => toggleSection('settings')}>
                  <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate(`/project/${id}/settings`); }}>
                    <FontAwesomeIcon icon={faGear} className={s.sectionIcon} />
                    Settings
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`${s.sectionChevron} ${sectionOpen.settings ? s.sectionChevronOpen : ''}`}
                  />
                </div>
                {sectionOpen.settings && (
                  <div className={s.sectionBody}>
                    {settingsDirectoryList.map(({ name, icon, path }, index) => {
                      const linkPath = `/project/${id}/${path}`;
                      const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                      return (
                        <Link key={index} to={linkPath} className={`${s.navItem} ${isActive ? s.activeLink : ''}`}>
                          {icon && <FontAwesomeIcon icon={icon} />}
                          {name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>}

            </>)}
          </div>
        </div>
        </>)}
      </div>
      {!isSmallScreen && <div className={s.resizeHandle} onMouseDown={handleResizeMouseDown} />}
    </div>
  );

  return menuContent;
};

