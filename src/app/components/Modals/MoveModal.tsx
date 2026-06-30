import s from './MoveModal.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faChevronDown, faChevronRight, faFolder,
  faXmark, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { StorageFolder } from '../../../interfaces';
import { getStorageFolders, moveStorageFile, moveStorageFolder } from '../../../services/storage';
import { ModalShell } from './ModalShell';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

interface MoveModalProps {
  projectId: string;
  activeConnId: string;
  itemType: 'file' | 'folder';
  itemId: string;
  itemName: string;
  onSuccess: () => void;
  onClose: () => void;
}

interface Destination {
  connId: string;
  folderId: string | null;
  label: string;
}

export function MoveModal({
  projectId, activeConnId, itemType, itemId, itemName, onSuccess, onClose,
}: MoveModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((s: RootState) => s.currentProject.data);
  const storages = useSelector((s: RootState) => s.management.storages);

  // connId → StorageConnection name map, including builtins
  const allConnections: { id: string; name: string; active: boolean }[] = [];
  if (storages.length > 0) {
    storages.forEach((st: any, i: number) => {
      const id = i === 0 ? 'builtin' : `builtin-${i}`;
      allConnections.push({ id, name: st.name ?? 'Builtin Storage', active: id === activeConnId });
    });
  }
  (currentProject?.storageConnections ?? []).forEach(c => {
    allConnections.push({ id: c.id, name: c.name, active: c.id === activeConnId });
  });

  // folder tree: key = `${connId}:${parentId ?? 'null'}` → StorageFolder[]
  const [folderMap, setFolderMap]   = useState<Record<string, StorageFolder[]>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  // expanded keys (connection root or folder)
  const [expanded, setExpanded]     = useState<Set<string>>(new Set([activeConnId]));
  const [selected, setSelected]     = useState<Destination | null>(null);
  const [moving, setMoving]         = useState(false);

  const folderKey = (connId: string, parentId: string | null) =>
    `${connId}:${parentId ?? 'null'}`;

  const loadFolders = useCallback(async (connId: string, parentId: string | null) => {
    const key = folderKey(connId, parentId);
    if (folderMap[key] !== undefined) return;
    setLoadingKeys(prev => new Set(prev).add(key));
    const folders = await getStorageFolders(projectId, connId, parentId);
    setFolderMap(prev => ({ ...prev, [key]: folders ?? [] }));
    setLoadingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
  }, [projectId, folderMap]);

  // Auto-load root of active connection on mount
  useEffect(() => {
    loadFolders(activeConnId, null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (key: string, connId: string, parentId: string | null) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(key)) { n.delete(key); } else {
        n.add(key);
        loadFolders(connId, parentId);
      }
      return n;
    });
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setMoving(true);
    try {
      if (itemType === 'file') {
        await moveStorageFile(projectId, selected.connId, itemId, selected.folderId);
      } else {
        await moveStorageFolder(projectId, selected.connId, itemId, selected.folderId);
      }
      dispatch(addApiResponse({ message: `${itemType === 'file' ? 'File' : 'Folder'} moved.`, type: 'success' }));
      onSuccess();
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to move item.', type: 'error' }));
    } finally {
      setMoving(false);
    }
  };

  const renderFolders = (connId: string, parentId: string | null, depth: number) => {
    const key = folderKey(connId, parentId);
    if (!expanded.has(parentId === null ? connId : `${connId}:${parentId}`)) return null;
    if (loadingKeys.has(key)) {
      return (
        <div className={s.loadingRow} style={{ paddingLeft: `${(depth + 1) * 1.1}rem` }}>
          <FontAwesomeIcon icon={faSpinner} spin className={s.spinner} />
        </div>
      );
    }
    const items = folderMap[key] ?? [];
    return items.map(folder => {
      const fKey = `${connId}:${folder.id}`;
      const childKey = folderKey(connId, folder.id);
      const isExpanded = expanded.has(fKey);
      const hasLoadedChildren = folderMap[childKey] !== undefined;
      const hasChildren = !hasLoadedChildren || (folderMap[childKey]?.length ?? 0) > 0;
      const isSelected = selected?.connId === connId && selected?.folderId === folder.id;
      // Exclude self when moving a folder
      if (itemType === 'folder' && folder.id === itemId) return null;

      return (
        <div key={folder.id}>
          <div
            className={`${s.treeRow} ${isSelected ? s.treeRowSelected : ''}`}
            style={{ paddingLeft: `${(depth + 1) * 1.1}rem` }}
            onClick={() => setSelected({ connId, folderId: folder.id, label: folder.name })}
          >
            <button
              type="button"
              className={s.expandBtn}
              onClick={e => {
                e.stopPropagation();
                toggleExpand(fKey, connId, folder.id);
              }}
            >
              {hasChildren
                ? <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} className={s.chevron} />
                : <span className={s.chevronSpacer} />}
            </button>
            <FontAwesomeIcon icon={faFolder} className={s.folderIcon} />
            <span className={s.folderName}>{folder.name}</span>
            {isSelected && <FontAwesomeIcon icon={faArrowRight} className={s.selectedMark} />}
          </div>
          {isExpanded && renderFolders(connId, folder.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <ModalShell
      title={`Move "${itemName}"`}
      icon={faArrowRight}
      onClose={onClose}
      footer={
        <>
          <SecondaryButton text="Cancel" icon={faXmark} onClick={onClose} disabled={moving} />
          <ActionButton
            text={moving ? 'Moving…' : 'Move here'}
            icon={faArrowRight}
            onClick={handleConfirm}
            disabled={!selected || moving}
            isLoading={moving}
          />
        </>
      }
    >
      <div className={s.tree}>
        {allConnections.map(conn => {
          const connExpKey = conn.id;
          const isExpanded = expanded.has(connExpKey);
          const rootKey = folderKey(conn.id, null);
          const isRootSelected = selected?.connId === conn.id && selected?.folderId === null;
          const isActive = conn.active;

          return (
            <div key={conn.id}>
              {/* Connection root row */}
              <div
                className={`${s.connRow} ${isRootSelected ? s.treeRowSelected : ''} ${!isActive ? s.connDisabled : ''}`}
                onClick={() => {
                  if (!isActive) return;
                  setSelected({ connId: conn.id, folderId: null, label: `${conn.name} (root)` });
                  if (!isExpanded) {
                    toggleExpand(connExpKey, conn.id, null);
                  }
                }}
              >
                <button
                  type="button"
                  className={s.expandBtn}
                  disabled={!isActive}
                  onClick={e => {
                    e.stopPropagation();
                    if (!isActive) return;
                    toggleExpand(connExpKey, conn.id, null);
                    if (!isExpanded) loadFolders(conn.id, null);
                  }}
                >
                  <FontAwesomeIcon
                    icon={loadingKeys.has(rootKey) ? faSpinner : isExpanded ? faChevronDown : faChevronRight}
                    spin={loadingKeys.has(rootKey)}
                    className={s.chevron}
                  />
                </button>
                <FontAwesomeIcon icon={faFolder} className={`${s.folderIcon} ${s.connIcon}`} />
                <span className={s.connName}>{conn.name}</span>
                {!isActive && <span className={s.comingSoon}>current only</span>}
                {isRootSelected && <FontAwesomeIcon icon={faArrowRight} className={s.selectedMark} />}
              </div>
              {/* Folder tree under this connection */}
              {isExpanded && renderFolders(conn.id, null, 0)}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className={s.destinationLabel}>
          <span>Moving to:</span>
          <strong>{selected.label}</strong>
        </div>
      )}
    </ModalShell>
  );
}
