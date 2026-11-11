import s from './IntegrationsInfo.module.css';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faPlugCircleCheck, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { fetchProject } from '../../../services/projects';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { IntegrationInfoEntry, IntegrationsInfoModal } from './IntegrationsInfoModal';

// The open project's integrations: the databases, storages and services connected to it (not
// the caster's own pool, which is the account's), by the workspace's mode.
export const IntegrationsInfoButton: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: project, loading } = useSelector((state: RootState) => state.currentProject);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const databaseEntries: IntegrationInfoEntry[] = (project?.dbConnections ?? []).map(c => ({
    id: c.id, name: c.name, provider: c.dbType, builtin: c.source === 'builtin' || !!c.isBuiltin, available: true,
  }));
  const storageEntries: IntegrationInfoEntry[] = (project?.storageConnections ?? []).map(c => ({
    id: c.id, name: c.name, provider: c.type, builtin: c.source === 'builtin' || !!c.isBuiltin, available: c.available !== false,
  }));
  const serviceEntries: IntegrationInfoEntry[] = (project?.integrationConnections ?? []).map(c => ({
    id: c.id, name: c.name, provider: c.provider, builtin: false, available: true,
  }));
  // Services are optional (not every project needs Claude/Jira/Google) — the connected
  // status only reflects database/storage, the two kinds every project actually needs.
  const allConnected = databaseEntries.length > 0 && storageEntries.length > 0;
  const anyConnected = databaseEntries.length > 0 || storageEntries.length > 0 || serviceEntries.length > 0;

  // The project again, in the background: its connections as they are now.
  const refresh = () => {
    if (!project?.id) return;
    fetchProject(project.id)
      .then(data => dispatch(setCurrentProject(data)))
      .catch(() => { /* the project as last loaded stays */ });
  };

  const getIcon = () => {
    if (loading) return <FontAwesomeIcon icon={faSpinner} spin className={s.icon} />;
    if (allConnected) return <FontAwesomeIcon icon={faGlobe} className={`${s.icon} ${s.iconConnected}`} />;
    if (anyConnected) return <FontAwesomeIcon icon={faPlugCircleCheck} className={`${s.icon} ${s.iconPartial}`} />;
    return <FontAwesomeIcon icon={faExclamationTriangle} className={`${s.icon} ${s.iconDisconnected}`} />;
  };

  const getTitle = () => {
    if (loading) return 'Loading integrations…';
    if (allConnected) return 'All integrations connected';
    if (anyConnected) return 'Some integrations connected';
    return 'No integrations connected';
  };

  return (
    <div className={s.container}>
      <button type="button" title={getTitle()} className={s.dbInfoButton} onClick={() => setIsModalOpen(v => !v)} data-testid="project-integrations-button">
        {getIcon()}
      </button>
      {isModalOpen && (
        <IntegrationsInfoModal
          databases={databaseEntries}
          storages={storageEntries}
          services={serviceEntries}
          onRefresh={refresh}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
