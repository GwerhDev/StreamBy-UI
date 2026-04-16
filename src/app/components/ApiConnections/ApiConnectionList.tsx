import s from './ApiConnectionList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { ActionButton } from '../Buttons/ActionButton';
import { ApiConnectionCard } from '../Cards/ApiConnectionCard';

export const ApiConnectionList = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: currentProjectData, loading } = useSelector((state: RootState) => state.currentProject);
  const connections = currentProjectData?.apiConnections ?? [];

  const handleCreate = () => navigate(`/project/${projectId}/connections/api/create`);

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
            <li
              key={conn.id}
              title={conn.name}
              onClick={() => navigate(`/project/${projectId}/connections/api/${conn.id}`)}
            >
              <ApiConnectionCard connection={conn} />
            </li>
          ))}
          <li className={s.createConnection} onClick={handleCreate}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>New connection</h4>
          </li>
        </ul>
      )}
    </div>
  );
};
