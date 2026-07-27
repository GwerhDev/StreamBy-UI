import s from './IntegrationConnection.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlug, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { deleteIntegrationConnection } from '../../../services/integrationConnections';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { SERVICE_PROVIDER_ICON } from '../Integrations/serviceProviderIcons';

import { IntegrationConnection, ServiceProviderType } from '../../../interfaces';

export const IntegrationConnectionList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project, loading } = useSelector((state: RootState) => state.currentProject);
  const allConnections: IntegrationConnection[] = project?.integrationConnections ?? [];

  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreate = () => navigate(`/project/${projectId}/services/create`);

  const handleDelete = async (e: React.MouseEvent, conn: IntegrationConnection) => {
    e.stopPropagation();
    if (!projectId || !project) return;
    setDeleting(conn.id);
    try {
      await deleteIntegrationConnection(projectId, conn.integrationId);
      dispatch(addApiResponse({ message: 'Connection deleted.', type: 'success' }));
      dispatch(setCurrentProject({
        ...project,
        integrationConnections: allConnections.filter(c => c.id !== conn.id),
      }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete connection.', type: 'error' }));
    } finally {
      setDeleting(null);
    }
  };

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
      ) : (
        <ul>
          {allConnections.map(conn => (
            <li key={conn.id}>
              <span className={s.cardLeft}>
                <span className={s.cardIcon}>
                  <FontAwesomeIcon icon={SERVICE_PROVIDER_ICON[conn.provider as ServiceProviderType]} />
                </span>
                <span className={s.cardInfo}>
                  <h4>{conn.name}</h4>
                  <small>{conn.description || conn.provider}</small>
                </span>
              </span>
              <span className={s.cardRight}>
                <button
                  className={s.deleteBtn}
                  disabled={deleting === conn.id}
                  onClick={e => handleDelete(e, conn)}
                  title="Delete connection"
                >
                  <FontAwesomeIcon icon={faTrash} />
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
    </div>
  );
};
