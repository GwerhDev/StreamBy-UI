import s from './Database.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableColumns, faPlus, faXmark, faFloppyDisk, faChevronLeft, faChevronRight, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { fetchRecords, insertRecord, updateRecord, deleteRecord } from '../../../services/database';
import { ExternalDbType } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { JsonEditor } from '../JsonEditor/JsonEditor';
import JsonViewer from '../JsonViewer/JsonViewer';

const PAGE_SIZE = 50;

function getRecordId(r: any): string {
  return String(r._id ?? r.id ?? '');
}

function getRecordLabel(r: any): string {
  return r._name || r.name || r.title || r.label || r.email || r.slug || r.key || getRecordId(r);
}

function recordToEditJson(r: any): string {
  const { _id, ...rest } = r;
  return JSON.stringify(rest, null, 2);
}

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

  // Insert state
  const [showInsert, setShowInsert] = useState(false);
  const [insertName, setInsertName] = useState('');
  const [insertJson, setInsertJson] = useState('{\n  \n}');
  const [insertValid, setInsertValid] = useState(true);
  const [inserting, setInserting] = useState(false);

  // Edit state
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editJson, setEditJson] = useState('{}');
  const [editValid, setEditValid] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      const base = JSON.parse(insertJson);
      const record = insertName ? { _name: insertName, ...base } : base;
      const result = await insertRecord(projectId, connId, tableName, record);
      if (result) {
        setShowInsert(false);
        setInsertName('');
        setInsertJson('{\n  \n}');
        load();
      }
    } catch {
      // json parse error; service already shows toast
    } finally {
      setInserting(false);
    }
  };

  const openEdit = (r: any) => {
    setEditRecord(r);
    setEditName(r._name || '');
    setEditJson(recordToEditJson(r));
    setEditValid(true);
  };

  const handleEdit = async () => {
    if (!projectId || !connId || !tableName || !editRecord || !editValid) return;
    setSaving(true);
    try {
      const base = JSON.parse(editJson);
      const updates = editName ? { _name: editName, ...base } : base;
      const result = await updateRecord(projectId, connId, tableName, getRecordId(editRecord), updates);
      if (result) {
        setEditRecord(null);
        load();
      }
    } catch {
      // json parse error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !connId || !tableName || !deleteTarget) return;
    setDeleting(true);
    const ok = await deleteRecord(projectId, connId, tableName, getRecordId(deleteTarget));
    if (ok) {
      setDeleteTarget(null);
      load();
    }
    setDeleting(false);
  };

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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {records.map((r, i) => (
            <div key={i} className={s.recordCard}>
              <div className={s.recordCardHeader}>
                <span className={s.recordCardName}>{getRecordLabel(r)}</span>
                <span className={s.recordActions}>
                  <button className={s.editBtn} title="Edit" onClick={() => openEdit(r)}>
                    <FontAwesomeIcon icon={faPencil} />
                  </button>
                  <button className={s.deleteBtn} title="Delete" onClick={() => setDeleteTarget(r)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </span>
              </div>
              <JsonViewer data={r as JSON} />
            </div>
          ))}
        </div>
      ) : (
        <div className={s.tableWrapper}>
          <table className={s.recordsTable}>
            <thead>
              <tr>
                {columns.map(col => <th key={col}>{col}</th>)}
                <th style={{ width: '5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col} title={String(row[col] ?? '')}>
                      {row[col] === null || row[col] === undefined
                        ? <em style={{ color: 'var(--color-light-400)' }}>null</em>
                        : String(row[col])}
                    </td>
                  ))}
                  <td>
                    <span className={s.recordActions}>
                      <button className={s.editBtn} title="Edit" onClick={() => openEdit(row)}>
                        <FontAwesomeIcon icon={faPencil} />
                      </button>
                      <button className={s.deleteBtn} title="Delete" onClick={() => setDeleteTarget(row)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </span>
                  </td>
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

      {/* Insert modal */}
      {showInsert && (
        <div className={s.modalOverlay} onClick={() => setShowInsert(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <div className={s.modalTitle}><FontAwesomeIcon icon={faPlus} /> Insert record into <em>{tableName}</em></div>
              <button className={s.modalClose} onClick={() => setShowInsert(false)}>×</button>
            </div>
            <div className={s.modalBody}>
              <input
                className={s.nameInput}
                type="text"
                placeholder="Display name (optional)"
                value={insertName}
                onChange={e => setInsertName(e.target.value)}
              />
              <JsonEditor
                value={insertJson}
                onChange={(str, _, valid) => { setInsertJson(str); setInsertValid(valid); }}
                readOnly={false}
                projectId={projectId}
                className={s.modalJsonEditor}
              />
            </div>
            <div className={s.modalActions}>
              <ActionButton icon={faFloppyDisk} text={inserting ? 'Inserting…' : 'Insert'} disabled={!insertValid || inserting} onClick={handleInsert} />
              <ActionButton icon={faXmark} text="Cancel" onClick={() => setShowInsert(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editRecord && (
        <div className={s.modalOverlay} onClick={() => setEditRecord(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <div className={s.modalTitle}><FontAwesomeIcon icon={faPencil} /> Edit record</div>
              <button className={s.modalClose} onClick={() => setEditRecord(null)}>×</button>
            </div>
            <div className={s.modalBody}>
              <input
                className={s.nameInput}
                type="text"
                placeholder="Display name (optional)"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
              <JsonEditor
                value={editJson}
                onChange={(str, _, valid) => { setEditJson(str); setEditValid(valid); }}
                readOnly={false}
                projectId={projectId}
                className={s.modalJsonEditor}
              />
            </div>
            <div className={s.modalActions}>
              <ActionButton icon={faFloppyDisk} text={saving ? 'Saving…' : 'Save'} disabled={!editValid || saving} onClick={handleEdit} />
              <ActionButton icon={faXmark} text="Cancel" onClick={() => setEditRecord(null)} />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className={s.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={s.modalHeader}>
              <div className={s.modalTitle}><FontAwesomeIcon icon={faTrash} /> Delete record</div>
              <button className={s.modalClose} onClick={() => setDeleteTarget(null)}>×</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-light-300)', margin: 0 }}>
              Delete <strong>{getRecordLabel(deleteTarget)}</strong>? This cannot be undone.
            </p>
            <div className={s.modalActions}>
              <ActionButton icon={faTrash} text={deleting ? 'Deleting…' : 'Delete'} disabled={deleting} onClick={handleDelete} />
              <ActionButton icon={faXmark} text="Cancel" onClick={() => setDeleteTarget(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
