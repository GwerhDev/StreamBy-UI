import s from './IntegrationConnection.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkSlash, faPlug, faPlus } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { fetchIntegrationConnections } from '../../../services/integrationConnections';
import { RemoveResourceModal } from '../Modals/RemoveResourceModal';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { SERVICE_PROVIDER_ICON } from '../Integrations/serviceProviderIcons';

import { IntegrationConnection, ServiceProviderType } from '../../../interfaces';
import { useProjectResource } from '../../../hooks/useProjectResource';

export const IntegrationConnectionList = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project, loading, removingIds } = useSelector((state: RootState) => state.currentProject);
  useProjectResource('integrationConnections', fetchIntegrationConnections);
  const allConnections: IntegrationConnection[] = project?.integrationConnections ?? [];

  const [toRemove, setToRemove] = useState<IntegrationConnection | null>(null);

  const handleCreate = () => navigate(`/project/${projectId}/services/create`);

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faPlug}
        title="Service Connections"
        subtitle="Manage Claude, Jira and Google connections for this project."
        action={!loading && allConnections.length === 0 ? <ActionButton icon={faPlus} text="Add connection" onClick={handleCreate} /> : undefined}
      />

      {loading ? (
        <ul>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : allConnections.length === 0 ? (
        <div className={s.emptyState}>
          <EmptyBackground />
        </div>
      ) : (
        <ul>
          {allConnections.map(conn => (
            <li key={conn.id} className={removingIds?.includes(conn.id) ? s.removing : undefined} data-testid={`service-${conn.id}`}>
              <span className={s.cardLeft}>
                <span className={s.cardIcon}>
                  <FontAwesomeIcon icon={SERVICE_PROVIDER_ICON[conn.provider as ServiceProviderType]} />
                </span>
                <span className={s.cardInfo}>
                  <h4>{conn.name}</h4>
                  <small>{removingIds?.includes(conn.id) ? 'Disconnecting…' : (conn.description || conn.provider)}</small>
                </span>
              </span>
              <span className={s.cardRight}>
                <button
                  className={s.deleteBtn}
                  data-testid={`disconnect-${conn.id}`}
                  disabled={removingIds?.includes(conn.id)}
                  onClick={e => { e.stopPropagation(); setToRemove(conn); }}
                  title="Disconnect"
                  aria-label={`Disconnect ${conn.name}`}
                >
                  <FontAwesomeIcon icon={faLinkSlash} />
                </button>
              </span>
            </li>
          ))}
          <li className={s.createItem} onClick={handleCreate}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>New connection</h4>
          </li>
        </ul>
      )}
      {toRemove && <RemoveResourceModal kind="service" resource={toRemove} onClose={() => setToRemove(null)} />}
    </div>
  );
};
