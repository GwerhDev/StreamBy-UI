import s from './Database.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableColumns, faPlus, faXmark, faFloppyDisk, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { fetchRecords, insertRecord } from '../../../services/database';
import { ExternalDbType } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { JsonEditor } from '../JsonEditor/JsonEditor';
import JsonViewer from '../JsonViewer/JsonViewer';

const PAGE_SIZE = 50;

export const DbRecords = () => {
  const { id: projectId, connId, tableName: rawTableName } = useParams<{ id: string; connId: string; tableName: string }>();
  const tableName = rawTableName ? decodeURIComponent(rawTableName) : '';
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
  const isMongo = conn?.dbType === 'mongodb';

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showInsert, setShowInsert] = useState(false);
  const [insertJson, setInsertJson] = useState('{\n  \n}');
  const [insertValid, setInsertValid] = useState(true);
  const [inserting, setInserting] = useState(false);

  const load = useCallback(async () => {
    if (!projectId || !connId || !tableName) return;
    setLoading(true);
    const data = await fetchRecords(projectId, connId, tableName, PAGE_SIZE, offset);
    setRecords(data);
    setLoading(false);
  }, [projectId, connId, tableName, offset]);

  useEffect(() => { load(); }, [load]);

  const handleInsert = async () => {
    if (!projectId || !connId || !tableName || !insertValid) return;
    setInserting(true);
    try {
      const record = JSON.parse(insertJson);
      const result = await insertRecord(projectId, connId, tableName, record);
      if (result) {
        setShowInsert(false);
        setInsertJson('{\n  \n}');
        if (offset === 0) load();
      }
    } catch {
      // json parse error; service already shows toast
    } finally {
      setInserting(false);
    }
  };

  // Build columns from first record
  const columns = records.length > 0 ? Object.keys(records[0]).filter(k => k !== '_id') : [];

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faTableColumns}
        title={tableName}
        subtitle={`Records in ${conn?.name ?? 'database'} — ${conn?.dbType ?? ''}`}
        action={<ActionButton icon={faPlus} text="Insert record" onClick={() => setShowInsert(true)} />}
      />

      {loading ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={skeleton.skeleton} style={{ width: '100%', height: '2.5rem', borderRadius: '0.5rem' }} />
          ))}
        </div>
      ) : records.length === 0 ? (
        <p className={s.noRecords}>No records found. Insert the first one!</p>
      ) : isMongo ? (
        <div style={{ width: '100%' }}>
          {records.map((r, i) => (
            <div key={i} style={{ marginBottom: '0.75rem', background: 'var(--color-dark-300)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
              <JsonViewer data={r as JSON} />
            </div>
          ))}
        </div>
      ) : (
        <div className={s.tableWrapper}>
          <table className={s.recordsTable}>
            <thead>
              <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
            </thead>
            <tbody>
              {records.map((row, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col} title={String(row[col] ?? '')}>
                      {row[col] === null || row[col] === undefined ? <em style={{ color: 'var(--color-light-400)' }}>null</em> : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && records.length > 0 && (
        <div className={s.pagination}>
          <button className={s.pageBtn} disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - PAGE_SIZE))}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-light-300)' }}>
            {offset + 1} – {offset + records.length}
          </span>
          <button className={s.pageBtn} disabled={records.length < PAGE_SIZE} onClick={() => setOffset(o => o + PAGE_SIZE)}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}

      {/* Insert record modal */}
      {showInsert && (
        <div className={s.modalOverlay} onClick={() => setShowInsert(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalTitle}>
              <FontAwesomeIcon icon={faPlus} />
              Insert record into <em>{tableName}</em>
            </div>
            <JsonEditor
              value={insertJson}
              onChange={(str, _, valid) => { setInsertJson(str); setInsertValid(valid); }}
              readOnly={false}
              projectId={projectId}
            />
            <div className={s.modalActions}>
              <ActionButton
                icon={faFloppyDisk}
                text={inserting ? 'Inserting…' : 'Insert'}
                disabled={!insertValid || inserting}
                onClick={handleInsert}
              />
              <ActionButton
                icon={faXmark}
                text="Cancel"
                onClick={() => setShowInsert(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
