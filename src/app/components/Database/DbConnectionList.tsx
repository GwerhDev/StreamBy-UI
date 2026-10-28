import s from './Database.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faLinkSlash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { fetchDbConnections } from '../../../services/database';
import { RemoveResourceModal } from '../Modals/RemoveResourceModal';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import streambyIcon from '../../../assets/streamby-icon.svg';

import { DbConnection } from '../../../interfaces';
import { useProjectResource } from '../../../hooks/useProjectResource';

export const DbConnectionList = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project, loading, removingIds } = useSelector((state: RootState) => state.currentProject);
  useProjectResource('dbConnections', fetchDbConnections);
  const allConnections: DbConnection[] = project?.dbConnections ?? [];

  const [toRemove, setToRemove] = useState<DbConnection | null>(null);

  const handleCreate = () => navigate(`/project/${projectId}/database/create`);

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faDatabase}
        title="Database Connections"
        subtitle="Manage database connections for this project."
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
            <li key={conn.id} className={removingIds?.includes(conn.id) ? s.removing : undefined} data-testid={`db-${conn.id}`} onClick={() => { if (!removingIds?.includes(conn.id)) navigate(`/project/${projectId}/database/${conn.id}`, { state: { dbType: conn.dbType, isBuiltin: conn.isBuiltin, name: conn.name } }); }}>
              <span className={s.cardLeft}>
                <span className={s.cardIcon}>
                  <FontAwesomeIcon icon={faDatabase} />
                </span>
                <span className={s.cardInfo}>
                  <h4>{conn.name}</h4>
                  <small>{removingIds?.includes(conn.id) ? 'Disconnecting…' : conn.isBuiltin ? 'Project built-in database' : (conn.description || conn.dbType)}</small>
                </span>
              </span>
              <span className={s.cardRight}>
                {conn.isBuiltin && (
                  <span className={`${s.badge} ${s.badgeBuiltin} ${s.badgeIcon}`} title="Built-in">
                    <img src={streambyIcon} alt="Built-in" className={s.builtinIcon} />
                  </span>
                )}
                <span className={`${s.badge} ${conn.dbType === 'postgresql' ? s.badgePg : s.badgeMg}`}>
                  {conn.dbType === 'postgresql' ? 'PostgreSQL' : 'MongoDB'}
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
      {toRemove && <RemoveResourceModal kind="db" resource={toRemove} onClose={() => setToRemove(null)} />}
    </div>
  );
};
