import s from './LateralMenu.module.css';
import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArchive, faBox, faChevronDown, faChevronLeft, faChevronRight, faCloud, faDatabase, faDoorOpen, faFileExport, faGear, faSitemap, faTableColumns, faTowerBroadcast, faTrash } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { apiDirectoryList, dashboardDirectoryList, settingsDirectoryList, storageDirectoryList, workflowSubDirectoryList } from '../../../config/consts';
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

interface RailItem { icon: IconDefinition; path: string; label: string; }

export const LateralMenu = ({ children, title, railItems }: { children?: React.ReactNode; title?: string; railItems?: RailItem[] } = {}) => {
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
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const [expandedStorages, setExpandedStorages] = useState<Set<string>>(new Set());
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
  const [dbTables, setDbTables] = useState<Record<string, string[]>>({});
  const [dbTablesLoading, setDbTablesLoading] = useState<Set<string>>(new Set());
  const { menuOpen, closeMenu, toggleMenu } = useEditorMenu();
  const location = useLocation();

  const isDashboardSection = location.pathname.includes(`/project/${id}/dashboard`);
  const isWorkflowsSection = location.pathname.includes(`/project/${id}/workflow`);
  const isExportsSection = location.pathname.includes(`/project/${id}/exports`);
  const isStorageSection = location.pathname.includes(`/project/${id}/storage`);
  const isDatabaseSection = location.pathname.includes(`/project/${id}/database`);
  const isConnectionsSection = location.pathname.includes(`/project/${id}/connections`);
  const isSettingsSection = location.pathname.includes(`/project/${id}/settings`);

  const [sectionOpen, setSectionOpen] = useState({
    dashboard: isDashboardSection,
    workflows: isWorkflowsSection,
    exports: isExportsSection,
    storage: isStorageSection,
    database: isDatabaseSection,
    connections: isConnectionsSection,
    settings: isSettingsSection,
  });

  useEffect(() => {
    setSectionOpen(prev => ({
      dashboard: prev.dashboard || isDashboardSection,
      workflows: prev.workflows || isWorkflowsSection,
      exports: prev.exports || isExportsSection,
      storage: prev.storage || isStorageSection,
      database: prev.database || isDatabaseSection,
      connections: prev.connections || isConnectionsSection,
      settings: prev.settings || isSettingsSection,
    }));
  }, [isDashboardSection, isWorkflowsSection, isExportsSection, isStorageSection, isDatabaseSection, isConnectionsSection, isSettingsSection]);

  const toggleSection = (key: keyof typeof sectionOpen) => {
    setSectionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const isEditorRoute = location.pathname.endsWith('/editor');
    if (isEditorRoute) {
      closeMenu();
    }
  }, [location]);

  const toggleWorkflow = (wfId: string) => {
    setExpandedWorkflows(prev => {
      const next = new Set(prev);
      if (next.has(wfId)) next.delete(wfId);
      else next.add(wfId);
      return next;
    });
  };

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

  const projectActionsContent = (
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
  );

  if (!menuOpen) {
    if (children) {
      return (
        <div className={`${s.wrapper} ${s.wrapperRail}`} style={{ width: '44px' }}>
          <div className={s.container}>
            {title && (
              <div className={s.railTitle}>
                <button className={s.railProjectBtn}>
                  <span className={s.railProjectInitial}>{title[0].toUpperCase()}</span>
                </button>
              </div>
            )}
            <button className={s.menuToggleFloat} onClick={toggleMenu}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            {railItems && (() => {
              const activeRailPath = railItems
                .filter(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
                .sort((a, b) => b.path.length - a.path.length)[0]?.path;
              return (
                <div className={s.railIcons}>
                  {railItems.map(item => (
                    <button
                      key={item.path}
                      className={`${s.railIcon} ${item.path === activeRailPath ? s.railIconActive : ''}`}
                      onClick={() => navigate(item.path)}
                      title={item.label}
                    >
                      <FontAwesomeIcon icon={item.icon} />
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      );
    }
    return (
      <div className={`${s.wrapper} ${s.wrapperRail}`} style={{ width: '44px' }}>
        <div className={s.container}>
          <div className={s.railTitle}>
            <button className={s.railProjectBtn} onClick={() => setShowCanvas(true)}>
              <span className={s.railProjectInitial}>{name?.[0]?.toUpperCase() ?? '·'}</span>
              <FontAwesomeIcon icon={faChevronDown} className={s.railProjectChevron} />
            </button>
            <div className={s.railCanvasAnchor}>
              <CustomCanvas showCanvas={showCanvas} setShowCanvas={setShowCanvas}>
                {projectActionsContent}
              </CustomCanvas>
            </div>
          </div>
          <button className={s.menuToggleFloat} onClick={toggleMenu}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          <div className={s.railIcons}>
            <button className={`${s.railIcon} ${isDashboardSection ? s.railIconActive : ''}`} onClick={() => navigate(`/project/${id}/dashboard`)} title="Dashboard">
              <FontAwesomeIcon icon={faTableColumns} />
            </button>
            {!isPending && (<>
              <button className={`${s.railIcon} ${isWorkflowsSection ? s.railIconActive : ''}`} onClick={() => navigate(`/project/${id}/workflows`)} title="Workflows">
                <FontAwesomeIcon icon={faSitemap} />
              </button>
              {mode === 'developer' && (
                <button className={`${s.railIcon} ${isExportsSection ? s.railIconActive : ''}`} onClick={() => navigate(`/project/${id}/exports`)} title="Exports">
                  <FontAwesomeIcon icon={faFileExport} />
                </button>
              )}
              <button className={`${s.railIcon} ${isStorageSection ? s.railIconActive : ''}`} onClick={() => navigate(`/project/${id}/storage`)} title="Storage">
                <FontAwesomeIcon icon={faBox} />
              </button>
              {mode === 'developer' && (<>
                <button className={`${s.railIcon} ${isDatabaseSection ? s.railIconActive : ''}`} onClick={() => navigate(`/project/${id}/database`)} title="Database">
                  <FontAwesomeIcon icon={faDatabase} />
                </button>
                <button className={`${s.railIcon} ${isConnectionsSection ? s.railIconActive : ''}`} onClick={() => navigate(`/project/${id}/connections`)} title="Connections">
                  <FontAwesomeIcon icon={faTowerBroadcast} />
                </button>
                <button className={`${s.railIcon} ${isSettingsSection ? s.railIconActive : ''}`} onClick={() => navigate(`/project/${id}/settings`)} title="Settings">
                  <FontAwesomeIcon icon={faGear} />
                </button>
              </>)}
            </>)}
          </div>
        </div>
      </div>
    );
  }

  const menuContent = (
    <div className={s.wrapper} style={{ width: `${menuWidth}px` }}>
      <div className={s.container}>
        {children ? (<>
          {title && (
            <div className={s.titleButton}>
              <span className={s.title}>
                <h4>{title}</h4>
              </span>
            </div>
          )}
          <div className={s.outterMenuContainer}>
            <div className={s.menuContainer}>{children}</div>
          </div>
        </>) : (<>
        <div className={s.titleButton}>
          <span className={s.title} onClick={() => setShowCanvas(true)}>
            <h4>{name}</h4>
            <FontAwesomeIcon icon={faChevronDown} />
          </span>
          <CustomCanvas showCanvas={showCanvas} setShowCanvas={setShowCanvas}>
            {projectActionsContent}
          </CustomCanvas>
        </div>
        <div className={s.outterMenuContainer}>
          <div className={s.menuContainer}>

            {/* DASHBOARD */}
            <div className={s.accordionSection}>
              <div className={`${s.sectionHeader} ${isDashboardSection ? s.sectionHeaderActive : ''}`} onClick={() => toggleSection('dashboard')}>
                <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate(`/project/${id}/dashboard`); }}>
                  Dashboard
                </span>
                <div className={`${s.sectionChevronWrap} ${sectionOpen.dashboard ? s.sectionChevronWrapOpen : ''}`}>
                  <FontAwesomeIcon icon={faTableColumns} className={s.sectionChevronSectionIcon} />
                  <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
                </div>
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

              {/* WORKFLOWS */}
              <div className={s.accordionSection}>
                <div className={`${s.sectionHeader} ${isWorkflowsSection ? s.sectionHeaderActive : ''}`} onClick={() => toggleSection('workflows')}>
                  <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate(`/project/${id}/workflows`); }}>
                    Workflows
                  </span>
                  <div className={`${s.sectionChevronWrap} ${sectionOpen.workflows ? s.sectionChevronWrapOpen : ''}`}>
                    <FontAwesomeIcon icon={faSitemap} className={s.sectionChevronSectionIcon} />
                    <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
                  </div>
                </div>
                {sectionOpen.workflows && (
                  <div className={s.sectionBody}>
                    {(currentProject.data?.workflows ?? []).map(wf => {
                      const isExpanded = expandedWorkflows.has(wf.id);
                      const linkPath = `/project/${id}/workflows/${wf.id}`;
                      const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                      return (
                        <React.Fragment key={wf.id}>
                          <Link to={linkPath} className={`${s.serviceHeader} ${isActive ? s.activeLink : ''}`}>
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className={`${s.serviceChevron} ${isExpanded ? s.serviceChevronOpen : ''}`}
                              onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWorkflow(wf.id); }}
                            />
                            <FontAwesomeIcon icon={faSitemap} className={s.serviceIcon} />
                            <span className={s.serviceName}>{wf.name}</span>
                          </Link>
                          {isExpanded && workflowSubDirectoryList.map(({ name, icon, path }, index) => {
                            const subPath = `/project/${id}/${path}`;
                            const isSubActive = location.pathname === subPath || location.pathname.startsWith(`${subPath}/`);
                            return (
                              <Link key={index} to={subPath} className={`${s.storageItem} ${isSubActive ? s.activeLink : ''}`}>
                                {icon && <FontAwesomeIcon icon={icon} />}
                                {name}
                              </Link>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                    {!(currentProject.data?.workflows?.length) && (
                      <span className={`${s.storageItem} ${s.storageItemMuted}`}>No workflows yet</span>
                    )}
                  </div>
                )}
              </div>

              {/* EXPORTS — Developer only */}
              {mode === 'developer' && (
              <div className={s.accordionSection}>
                <div className={`${s.sectionHeader} ${isExportsSection ? s.sectionHeaderActive : ''}`} onClick={() => toggleSection('exports')}>
                  <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate(`/project/${id}/exports`); }}>
                    Exports
                  </span>
                  <div className={`${s.sectionChevronWrap} ${sectionOpen.exports ? s.sectionChevronWrapOpen : ''}`}>
                    <FontAwesomeIcon icon={faFileExport} className={s.sectionChevronSectionIcon} />
                    <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
                  </div>
                </div>
                {sectionOpen.exports && (
                  <div className={s.sectionBody}>
                    {(currentProject.data?.exports ?? []).map(exp => {
                      const linkPath = `/project/${id}/exports/${exp.id}`;
                      const isActive = location.pathname === linkPath || location.pathname.startsWith(`${linkPath}/`);
                      return (
                        <Link key={exp.id} to={linkPath} className={`${s.serviceHeader} ${isActive ? s.activeLink : ''}`}>
                          <FontAwesomeIcon icon={faFileExport} className={s.serviceIcon} />
                          <span className={s.serviceName}>{exp.name}</span>
                        </Link>
                      );
                    })}
                    {!(currentProject.data?.exports?.length) && (
                      <span className={`${s.storageItem} ${s.storageItemMuted}`}>No exports yet</span>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* STORAGE */}
              <div className={s.accordionSection}>
                <div className={`${s.sectionHeader} ${isStorageSection ? s.sectionHeaderActive : ''}`} onClick={() => toggleSection('storage')}>
                  <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate(`/project/${id}/storage`); }}>
                    Storage
                  </span>
                  <div className={`${s.sectionChevronWrap} ${sectionOpen.storage ? s.sectionChevronWrapOpen : ''}`}>
                    <FontAwesomeIcon icon={faBox} className={s.sectionChevronSectionIcon} />
                    <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
                  </div>
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
                    Database
                  </span>
                  <div className={`${s.sectionChevronWrap} ${sectionOpen.database ? s.sectionChevronWrapOpen : ''}`}>
                    <FontAwesomeIcon icon={faDatabase} className={s.sectionChevronSectionIcon} />
                    <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
                  </div>
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
                    Connections
                  </span>
                  <div className={`${s.sectionChevronWrap} ${sectionOpen.connections ? s.sectionChevronWrapOpen : ''}`}>
                    <FontAwesomeIcon icon={faTowerBroadcast} className={s.sectionChevronSectionIcon} />
                    <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
                  </div>
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
                    Settings
                  </span>
                  <div className={`${s.sectionChevronWrap} ${sectionOpen.settings ? s.sectionChevronWrapOpen : ''}`}>
                    <FontAwesomeIcon icon={faGear} className={s.sectionChevronSectionIcon} />
                    <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
                  </div>
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
      <button className={s.menuToggleFloat} onClick={toggleMenu}>
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
    </div>
  );

  return menuContent;
};

