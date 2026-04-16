import s from './ApiConnectionList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { ActionButton } from '../Buttons/ActionButton';
import { ApiConnectionCard } from '../Cards/ApiConnectionCard';
import { ApiConnection } from '../../../interfaces';
import { deleteApiConnection } from '../../../services/apiConnections';
import { setCurrentProject } from '../../../store/currentProjectSlice';

export const ApiConnectionList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: currentProjectData, loading } = useSelector((state: RootState) => state.currentProject);
  const connections = currentProjectData?.apiConnections ?? [];

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    navigate(`/project/${projectId}/api/connections/create`);
  };

  const handleDelete = async (connection: ApiConnection) => {
    if (!projectId || !currentProjectData) return;
    setDeletingId(connection.id);
    try {
      await deleteApiConnection(projectId, connection.id);
      const updated = connections.filter(c => c.id !== connection.id);
      dispatch(setCurrentProject({ ...currentProjectData, apiConnections: updated }));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2>API Connections</h2>
        <p>Manage the external API connections for this project.</p>
      </div>

      {loading ? (
        <ul>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : !connections.length ? (
        <ActionButton icon={faPlus} text="Create new connection" onClick={handleCreate} />
      ) : (
        <ul>
          {connections.map(conn => (
            <li key={conn.id} title={conn.name}>
              <ApiConnectionCard connection={conn} />
              <button
                className={s.deleteButton}
                disabled={deletingId === conn.id}
                onClick={e => { e.stopPropagation(); handleDelete(conn); }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </li>
          ))}
          <li className={s.createConnection} onClick={handleCreate}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>New connection</h4>
          </li>
        </ul>
      )
      }
    </div >
  );
};
