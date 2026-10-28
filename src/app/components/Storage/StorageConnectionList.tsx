import s from './StorageConnectionList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud, faLinkSlash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { fetchStorageConnections } from '../../../services/storageConnections';
import { RemoveResourceModal } from '../Modals/RemoveResourceModal';
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
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project, loading, removingIds } = useSelector((state: RootState) => state.currentProject);

  useProjectResource('storageConnections', fetchStorageConnections);
  const connections: StorageConnection[] = project?.storageConnections ?? [];
  const [toRemove, setToRemove] = useState<StorageConnection | null>(null);

  const handleCreate = () => navigate(`/project/${projectId}/storage/create`);

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
              className={removingIds?.includes(conn.id) ? s.removing : undefined}
              data-testid={`storage-${conn.id}`}
              onClick={() => { if (!removingIds?.includes(conn.id)) navigate(`/project/${projectId}/storage/${conn.id}`); }}
            >
              <span className={s.cardLeft}>
                <span className={s.cardIcon}>
                  <FontAwesomeIcon icon={faCloud} />
                </span>
                <span className={s.cardInfo}>
                  <h4>{conn.name}</h4>
                  <small>{removingIds?.includes(conn.id) ? 'Disconnecting…' : conn.isBuiltin ? 'Project built-in storage' : (conn.description || STORAGE_LABELS[conn.type] || conn.type)}</small>
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
      {toRemove && <RemoveResourceModal kind="storage" resource={toRemove} onClose={() => setToRemove(null)} />}
    </div>
  );
};
