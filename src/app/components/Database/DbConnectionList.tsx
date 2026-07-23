import s from './Database.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { deleteDbConnection } from '../../../services/database';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import streambyIcon from '../../../assets/streamby-icon.svg';

import { DbConnection } from '../../../interfaces';

export const DbConnectionList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project, loading } = useSelector((state: RootState) => state.currentProject);
  const allConnections: DbConnection[] = project?.dbConnections ?? [];

  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreate = () => navigate(`/project/${projectId}/database/create`);

  const handleDelete = async (e: React.MouseEvent, connId: string) => {
    e.stopPropagation();
    if (!projectId || !project) return;
    setDeleting(connId);
    try {
      await deleteDbConnection(projectId, connId);
      dispatch(addApiResponse({ message: 'Connection deleted.', type: 'success' }));
      dispatch(setCurrentProject({
        ...project,
        dbConnections: allConnections.filter(c => c.id !== connId),
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
            <li key={conn.id} onClick={() => navigate(`/project/${projectId}/database/${conn.id}`, { state: { dbType: conn.dbType, isBuiltin: conn.isBuiltin, name: conn.name } })}>
              <span className={s.cardLeft}>
                <span className={s.cardIcon}>
                  <FontAwesomeIcon icon={faDatabase} />
                </span>
                <span className={s.cardInfo}>
                  <h4>{conn.name}</h4>
                  <small>{conn.isBuiltin ? 'Project built-in database' : (conn.description || conn.dbType)}</small>
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
