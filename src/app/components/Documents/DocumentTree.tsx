import s from '../Storage/StorageDrive.module.css';
import d from './Documents.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileLines, faFolder, faFolderOpen, faFolderPlus, faList, faMagnifyingGlass, faPencil, faPlus, faTableCells, faTrash, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { childrenOf, fetchDocuments, removeDocuments, upsertDocument } from '../../../store/documentsSlice';
import { createDocument, deleteDocument, saveDocument, updateDocument } from '../../../services/documents';
import { DocumentSummary } from '../../../interfaces';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ModalShell } from '../Modals/ModalShell';
import { LabeledInput } from '../Inputs/LabeledInput';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { useDocumentsRole } from './documentText';
import { useDocumentList } from './useDocumentList';

/** Every folder, with its path ("Concept / Model"), to choose where something goes. */
export const folderOptions = (list: DocumentSummary[], except?: string) => {
  const options: { value: string; label: string }[] = [{ value: '', label: 'At the top' }];
  const walk = (parentId: string | null, path: string) => {
    for (const folder of childrenOf(list, parentId).filter(f => f.kind === 'folder' && f.id !== except)) {
      const label = path ? `${path} / ${folder.title}` : folder.title;
      options.push({ value: folder.id, label });
      walk(folder.id, label);
    }
  };
  walk(null, '');
  return options;
};

const DRAG_TYPE = 'application/streamby-document';
type Menu = { doc: DocumentSummary | null; x: number; y: number };

// A project's documents, as Storage shows files: one folder at a time (the top, or the one
// given), folders first; a double click opens, a right click offers what can be done.
export const DocumentTree = ({ folder }: { folder?: DocumentSummary } = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId = '' } = useParams<{ id: string }>();
  const { canEdit } = useDocumentsRole();
  const list = useDocumentList(projectId);
  const root = folder?.id ?? null;
  const base = `/project/${projectId}/dashboard/documents`;

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    () => (localStorage.getItem('streamby-documents-view') as 'grid' | 'list') ?? 'grid',
  );
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [creatingDocument, setCreatingDocument] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const fail = (err: unknown, fallback: string) =>
    dispatch(addApiResponse({ message: err instanceof Error ? err.message : fallback, type: 'error' }));

  // Fresh each time it's opened (someone may have changed them).
  useEffect(() => {
    dispatch(fetchDocuments(projectId)).unwrap().catch(err => fail(err, 'Failed to load the documents.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, projectId]);

  useEffect(() => { localStorage.setItem('streamby-documents-view', viewMode); }, [viewMode]);
  useEffect(() => { if (renaming) { renameRef.current?.focus(); renameRef.current?.select(); } }, [renaming?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // The menu closes on a click elsewhere, or Escape.
  useEffect(() => {
    if (!menu) return;
    const close = () => { setMenu(null); setConfirmDelete(false); };
    const onDown = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [menu]);

  const here = childrenOf(list ?? [], root)
    .filter(doc => !search || doc.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'folder' ? -1 : 1));

  const open = (doc: DocumentSummary) => navigate(`${base}/${doc.id}`);

  const openMenu = (e: React.MouseEvent, doc: DocumentSummary | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canEdit && !doc) return;
    if (doc) setSelected(doc.id);
    const x = e.clientX + 192 > window.innerWidth ? e.clientX - 192 : e.clientX;
    const y = e.clientY + 120 > window.innerHeight ? e.clientY - 120 : e.clientY;
    setMenu({ doc, x, y });
    setConfirmDelete(false);
  };

  // A new folder, named in place.
  const createFolder = async () => {
    setMenu(null);
    try {
      const created = await createDocument(projectId, { title: 'New folder', kind: 'folder', parentId: root });
      dispatch(upsertDocument(created));
      setRenaming({ id: created.id, value: created.title });
    } catch (err) { fail(err, 'Failed to create the folder.'); }
  };

  const commitRename = async () => {
    if (!renaming) return;
    const target = list?.find(doc => doc.id === renaming.id);
    const title = renaming.value.trim();
    setRenaming(null);
    if (!target || !title || title === target.title) return;
    try {
      dispatch(upsertDocument(await saveDocument(projectId, target.id, target.version, { title })));
    } catch (err) {
      fail(err, 'Failed to rename it.');
      dispatch(fetchDocuments(projectId));
    }
  };

  const remove = async () => {
    const target = menu?.doc;
    if (!target) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setMenu(null);
    setConfirmDelete(false);
    try {
      dispatch(removeDocuments(await deleteDocument(projectId, target.id)));
      dispatch(addApiResponse({ message: `${target.title} deleted.`, type: 'success' }));
    } catch (err) { fail(err, 'Failed to delete it.'); }
  };

  // Dropped on a folder: it goes in it.
  const moveInto = async (e: React.DragEvent, into: DocumentSummary) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    const id = e.dataTransfer.getData(DRAG_TYPE);
    if (!id || id === into.id) return;
    try {
      dispatch(upsertDocument(await updateDocument(projectId, id, { parentId: into.id })));
      dispatch(addApiResponse({ message: `Moved to ${into.title}.`, type: 'success' }));
    } catch (err) { fail(err, 'Failed to move it.'); }
  };

  // What a folder or a document takes, as an item of the grid or the list.
  const itemProps = (doc: DocumentSummary) => ({
    'data-file': 'true',
    'data-testid': `document-${doc.id}`,
    draggable: canEdit && renaming?.id !== doc.id,
    onDragStart: (e: React.DragEvent) => { e.dataTransfer.setData(DRAG_TYPE, doc.id); e.dataTransfer.effectAllowed = 'move'; },
    onClick: () => setSelected(doc.id),
    onDoubleClick: () => { if (renaming?.id !== doc.id) open(doc); },
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' && renaming?.id !== doc.id) open(doc); },
    onContextMenu: (e: React.MouseEvent) => openMenu(e, doc),
    ...(doc.kind === 'folder' && canEdit ? {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(doc.id); },
      onDragLeave: (e: React.DragEvent) => { e.stopPropagation(); setDragOver(null); },
      onDrop: (e: React.DragEvent) => moveInto(e, doc),
    } : {}),
  });

  const nameOf = (doc: DocumentSummary, inputClass: string, nameClass: string) => (renaming?.id === doc.id ? (
    <input
      ref={renameRef}
      className={inputClass}
      value={renaming.value}
      aria-label="Name"
      onChange={e => setRenaming({ id: doc.id, value: e.target.value })}
      onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); }}
      onBlur={commitRename}
      onClick={e => e.stopPropagation()}
    />
  ) : <span className={nameClass}>{doc.title}</span>);

  const versionOf = (doc: DocumentSummary) =>
    doc.kind === 'folder' ? '—' : `v${doc.version}${doc.publishedVersion !== null ? ` · published v${doc.publishedVersion}` : ''}`;

  return (
    <div className={s.drive}>
      <div className={s.main}>
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={s.searchIcon} />
            <input type="text" placeholder="Search documents…" className={s.searchInput} value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button className={s.searchClear} onClick={() => setSearch('')} type="button" aria-label="Clear the search">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
          <div className={s.viewToggle}>
            <button type="button" className={`${s.viewBtn} ${viewMode === 'grid' ? s.viewBtnActive : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
              <FontAwesomeIcon icon={faTableCells} />
            </button>
            <button type="button" className={`${s.viewBtn} ${viewMode === 'list' ? s.viewBtnActive : ''}`} onClick={() => setViewMode('list')} title="List view">
              <FontAwesomeIcon icon={faList} />
            </button>
          </div>
          {canEdit && (
            <div className={d.toolbarActions}>
              <button type="button" className={s.uploadBtn} onClick={createFolder}>
                <FontAwesomeIcon icon={faFolderPlus} />
                New folder
              </button>
              <button type="button" className={s.uploadBtn} onClick={() => setCreatingDocument(true)}>
                <FontAwesomeIcon icon={faPlus} />
                New document
              </button>
            </div>
          )}
        </div>

        <div
          className={s.content}
          onClick={e => { if (!(e.target as Element).closest('[data-file]')) setSelected(null); }}
          onContextMenu={e => openMenu(e, null)}
        >
          {list === null ? (
            <div className={s.grid}>{Array.from({ length: 8 }).map((_, i) => <div key={i} className={`${s.gridSkeleton} ${skeleton.skeleton}`} />)}</div>
          ) : here.length === 0 ? (
            <div className={d.emptyState}><EmptyBackground /></div>
          ) : viewMode === 'grid' ? (
            <div className={s.grid} data-testid="document-tree">
              {here.map(doc => (
                <div
                  key={doc.id}
                  className={`${s.folderCard} ${selected === doc.id ? s.folderCardSelected : ''} ${dragOver === doc.id ? s.folderCardDragOver : ''}`}
                  {...itemProps(doc)}
                >
                  <FontAwesomeIcon icon={doc.kind === 'folder' ? faFolder : faFileLines} className={s.folderCardIcon} />
                  {nameOf(doc, s.folderCardRenameInput, s.folderCardName)}
                  {doc.kind === 'document' && <small className={d.muted}>{versionOf(doc)}</small>}
                </div>
              ))}
            </div>
          ) : (
            <div className={s.list} data-testid="document-tree">
              <div className={s.listHeader}>
                <span className={s.listHeaderName}>Name</span>
                <span className={s.listHeaderBadge}>Type</span>
                <span className={s.listHeaderSize}>Version</span>
                <span className={s.listHeaderDate}>Modified</span>
              </div>
              {here.map(doc => (
                <div
                  key={doc.id}
                  role="button"
                  tabIndex={0}
                  className={`${s.listRow} ${selected === doc.id ? s.listRowSelected : ''} ${dragOver === doc.id ? s.folderCardDragOver : ''}`}
                  {...itemProps(doc)}
                >
                  <FontAwesomeIcon icon={doc.kind === 'folder' ? faFolder : faFileLines} className={`${s.listIcon} ${doc.kind === 'folder' ? s.folderIcon : ''}`} />
                  {nameOf(doc, s.folderListRenameInput, s.listName)}
                  <span className={s.listBadge}>{doc.kind === 'folder' ? 'Folder' : 'Document'}</span>
                  <span className={s.listSize}>{versionOf(doc)}</span>
                  <span className={s.listDate}>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {menu && (
        <ul ref={menuRef} className={s.bgCtxMenu} style={{ top: menu.y, left: menu.x }} data-testid="document-menu">
          {menu.doc ? (
            <>
              <li className={s.bgCtxItem} onClick={() => { setMenu(null); open(menu.doc!); }}>
                <FontAwesomeIcon icon={menu.doc.kind === 'folder' ? faFolderOpen : faFileLines} className={s.bgCtxIcon} />
                Open
              </li>
              {canEdit && menu.doc.kind === 'folder' && (
                <li className={s.bgCtxItem} onClick={() => { setRenaming({ id: menu.doc!.id, value: menu.doc!.title }); setMenu(null); }}>
                  <FontAwesomeIcon icon={faPencil} className={s.bgCtxIcon} />
                  Rename
                </li>
              )}
              {canEdit && (
                <>
                  <li className={s.bgCtxDivider} />
                  <li className={`${s.bgCtxItem} ${confirmDelete ? s.bgCtxItemConfirm : s.bgCtxItemDanger}`} onClick={remove}>
                    <FontAwesomeIcon icon={faTrash} className={s.bgCtxIcon} />
                    {confirmDelete ? (menu.doc.kind === 'folder' ? 'Delete it and all inside' : 'Confirm delete') : 'Delete'}
                  </li>
                </>
              )}
            </>
          ) : (
            <>
              <li className={s.bgCtxItem} onClick={createFolder}>
                <FontAwesomeIcon icon={faFolderPlus} className={s.bgCtxIcon} />
                New folder
              </li>
              <li className={s.bgCtxItem} onClick={() => { setMenu(null); setCreatingDocument(true); }}>
                <FontAwesomeIcon icon={faPlus} className={s.bgCtxIcon} />
                New document
              </li>
            </>
          )}
        </ul>
      )}

      {creatingDocument && (
        <CreateDocumentModal
          onClose={() => setCreatingDocument(false)}
          onCreate={async title => {
            const created = await createDocument(projectId, { title, kind: 'document', parentId: root });
            dispatch(upsertDocument(created));
            setCreatingDocument(false);
            navigate(`${base}/${created.id}/edit`);
          }}
        />
      )}
    </div>
  );
};

const CreateDocumentModal = ({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string) => Promise<void> }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate(title.trim());
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to create it.', type: 'error' }));
      setSaving(false);
    }
  };

  return (
    <ModalShell title="New document" icon={faPlus} onClose={onClose}>
      <form className={d.modalBody} onSubmit={handleSubmit} data-testid="create-document-form">
        <LabeledInput id="document-title" htmlFor="document-title" name="document-title" type="text" label="Title" placeholder="e.g. Architecture" value={title} onChange={e => setTitle(e.target.value)} />
        <div className={d.modalActions}>
          <ActionButton type="submit" icon={faPlus} text="Create" disabled={!title.trim() || saving} isLoading={saving} />
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} />
        </div>
      </form>
    </ModalShell>
  );
};
