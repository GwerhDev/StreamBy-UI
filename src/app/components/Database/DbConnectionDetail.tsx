import s from './Database.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faPlus, faTableColumns, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { fetchTables, deleteTable } from '../../../services/database';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ExternalDbType } from '../../../interfaces';

export const DbConnectionDetail = () => {
  const { id: projectId, connId } = useParams<{ id: string; connId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
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
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    if (!projectId || !connId) return;
    setLoading(true);
    try {
      const data = await fetchTables(projectId, connId);
      setTables(data);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to load tables.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [projectId, connId]);

  useEffect(() => { load(); }, [load]);

  const connState = { dbType: conn.dbType, isBuiltin: conn.isBuiltin, name: conn.name };
  const handleCreate = () => navigate(`/project/${projectId}/database/${connId}/create`, { state: connState });
  const handleTable = (tableName: string) => navigate(`/project/${projectId}/database/${connId}/${encodeURIComponent(tableName)}`, { state: connState });

  const openDeleteModal = (e: React.MouseEvent, tableName: string) => {
    e.stopPropagation();
    setPendingDelete(tableName);
    setDeleteConfirm('');
  };

  const closeDeleteModal = () => {
    setPendingDelete(null);
    setDeleteConfirm('');
  };

  const handleDelete = async () => {
    if (!projectId || !connId || !pendingDelete) return;
    setDeleteLoading(true);
    try {
      await deleteTable(projectId, connId, pendingDelete);
      dispatch(addApiResponse({ message: 'Deleted successfully.', type: 'success' }));
      setTables(prev => prev.filter(t => t !== pendingDelete));
      closeDeleteModal();
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete.', type: 'error' }));
    } finally {
      setDeleteLoading(false);
    }
  };

  const typeName = conn?.dbType === 'postgresql' ? 'Tables' : 'Collections';
  const itemLabel = conn?.dbType === 'postgresql' ? 'table' : 'collection';

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faDatabase}
        title={conn?.name ?? 'Database'}
        subtitle={`Browse ${typeName.toLowerCase()} in this ${conn?.dbType ?? 'database'} connection.`}
        action={<ActionButton icon={faPlus} text={`New ${itemLabel}`} onClick={handleCreate} />}
      />

      {loading ? (
        <div className={s.tableGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${s.tableCard} ${s.cardSkeletonSm} ${skeleton.skeleton}`} />
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
              <button
                type="button"
                className={s.tableCardDelete}
                onClick={e => openDeleteModal(e, t)}
                title={`Delete ${itemLabel}`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <div className={s.modalOverlay} onClick={closeDeleteModal}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalTitle}>
              <FontAwesomeIcon icon={faTrash} className={s.modalDangerIcon} />
              Delete {itemLabel}
            </div>
            <p className={s.modalConfirmText}>
              Type <strong>{pendingDelete}</strong> to confirm deletion. This action cannot be undone.
            </p>
            <input
              type="text"
              className={s.nameInput}
              placeholder={pendingDelete}
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              autoFocus
            />
            <div className={s.modalActions}>
              <ActionButton
                icon={faTrash}
                text={deleteLoading ? 'Deleting…' : 'Delete'}
                onClick={handleDelete}
                disabled={deleteConfirm !== pendingDelete || deleteLoading}
              />
              <SecondaryButton icon={faXmark} text="Cancel" onClick={closeDeleteModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
