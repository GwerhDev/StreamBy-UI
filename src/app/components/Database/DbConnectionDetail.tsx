import s from './Database.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faPlus, faTableColumns } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { fetchTables } from '../../../services/database';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ExternalDbType } from '../../../interfaces';

export const DbConnectionDetail = () => {
  const { id: projectId, connId } = useParams<{ id: string; connId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state ?? {}) as { dbType?: string; isBuiltin?: boolean; name?: string };
  const project = useSelector((state: RootState) => state.currentProject.data);
  const externalConn = project?.dbConnections?.find(c => c.id === connId);
  const conn = externalConn ?? {
    id: connId!,
    name: locationState.name ?? connId!,
    dbType: (locationState.dbType ?? 'mongodb') as ExternalDbType,
    isBuiltin: locationState.isBuiltin ?? true,
  };

  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId || !connId) return;
    setLoading(true);
    const data = await fetchTables(projectId, connId);
    setTables(data);
    setLoading(false);
  }, [projectId, connId]);

  useEffect(() => { load(); }, [load]);

  const connState = { dbType: conn.dbType, isBuiltin: conn.isBuiltin, name: conn.name };
  const handleCreate = () => navigate(`/project/${projectId}/database/${connId}/create`, { state: connState });
  const handleTable = (tableName: string) => navigate(`/project/${projectId}/database/${connId}/${encodeURIComponent(tableName)}`, { state: connState });

  const typeName = conn?.dbType === 'postgresql' ? 'Tables' : 'Collections';

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faDatabase}
        title={conn?.name ?? 'Database'}
        subtitle={`Browse ${typeName.toLowerCase()} in this ${conn?.dbType ?? 'database'} connection.`}
        action={<ActionButton icon={faPlus} text={`New ${conn?.dbType === 'postgresql' ? 'table' : 'collection'}`} onClick={handleCreate} />}
      />

      {loading ? (
        <div className={s.tableGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${s.tableCard} ${skeleton.skeleton}`} style={{ height: '3.5rem' }} />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className={s.emptyState}><EmptyBackground /></div>
      ) : (
        <div className={s.tableGrid}>
          {tables.map(t => (
            <div key={t} className={s.tableCard} onClick={() => handleTable(t)}>
              <FontAwesomeIcon icon={faTableColumns} className={s.tableCardIcon} />
              <span className={s.tableCardName}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
