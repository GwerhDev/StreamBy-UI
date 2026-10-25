import s from './StorageConnectionList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { fetchStorageConnections, deleteStorageConnection } from '../../../services/storageConnections';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { StorageConnection } from '../../../interfaces';
import streambyIcon from '../../../assets/streamby-icon.svg';
import { useProjectResource } from '../../../hooks/useProjectResource';

const STORAGE_LABELS: Record<string, string> = {
  s3:    'AWS S3',
  gcs:   'Google Cloud Storage',
  r2:    'Cloudflare R2',
  azure: 'Azure Blob Storage',
};

const STORAGE_BADGE_CLASS: Record<string, string> = {
  s3:    s.badgePg,
  gcs:   s.badgeMg,
  r2:    s.badgeBuiltin,
  azure: s.badgePg,
};

export const StorageConnectionList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project, loading } = useSelector((state: RootState) => state.currentProject);

  useProjectResource('storageConnections', fetchStorageConnections);
  const connections: StorageConnection[] = project?.storageConnections ?? [];
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreate = () => navigate(`/project/${projectId}/storage/create`);

  const handleDelete = async (e: React.MouseEvent, connId: string) => {
    e.stopPropagation();
    if (!projectId || !project) return;
    setDeleting(connId);
    try {
      await deleteStorageConnection(projectId, connId);
      dispatch(addApiResponse({ message: 'Storage connection deleted.', type: 'success' }));
      dispatch(setCurrentProject({
        ...project,
        storageConnections: (project.storageConnections ?? []).filter(c => c.id !== connId),
      }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete storage connection.', type: 'error' }));
    } finally {
      setDeleting(null);
    }
  };

  const isLoading = loading;

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faCloud}
        title="Storage Connections"
        subtitle="Manage storage connections for this project."
        action={!isLoading && connections.length === 0 ? <ActionButton icon={faPlus} text="Add connection" onClick={handleCreate} /> : undefined}
      />

      {isLoading ? (
        <ul>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : (
        <ul>
          {connections.map(conn => (
            <li
              key={conn.id}
              onClick={() => navigate(`/project/${projectId}/storage/${conn.id}`)}
            >
              <span className={s.cardLeft}>
                <span className={s.cardIcon}>
                  <FontAwesomeIcon icon={faCloud} />
                </span>
                <span className={s.cardInfo}>
                  <h4>{conn.name}</h4>
                  <small>{conn.isBuiltin ? 'Project built-in storage' : (conn.description || STORAGE_LABELS[conn.type] || conn.type)}</small>
                </span>
              </span>
              <span className={s.cardRight}>
                {conn.isBuiltin && (
                  <span className={`${s.badge} ${s.badgeBuiltin} ${s.badgeIcon}`} title="Built-in">
                    <img src={streambyIcon} alt="Built-in" className={s.builtinIcon} />
                  </span>
                )}
                <span className={`${s.badge} ${STORAGE_BADGE_CLASS[conn.type] ?? s.badgePg}`}>
                  {STORAGE_LABELS[conn.type] || conn.type}
                </span>
                {!conn.isBuiltin && (
                  <button
                    className={s.deleteBtn}
                    disabled={deleting === conn.id}
                    onClick={e => handleDelete(e, conn.id)}
                    title="Delete connection"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
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
