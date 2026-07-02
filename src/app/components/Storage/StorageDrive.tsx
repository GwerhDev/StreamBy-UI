import s from './StorageDrive.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage, faHeadphones, faVideo, faCubes, faCloudArrowUp,
  faTableCells, faList, faMagnifyingGlass, faChevronDown, faXmark,
  faFolder, faFolderPlus, faPencil, faTrash, faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory, StorageFolder } from '../../../interfaces';
import { StorageCard } from './StorageCard';
import { FileDetailPanel } from './FileDetailPanel';
import { UploadModal } from '../Modals/UploadModal';
import { MoveModal } from '../Modals/MoveModal';
import { DropdownInput } from '../Inputs/DropdownInput';
import {
  getStorageFiles,
  getStorageUploadUrl,
  deleteStorageFile,
  renameStorageFile,
  getStorageReplaceUrl,
  uploadToPresignedUrl,
  getStorageFolders,
  getStorageFolderById,
  createStorageFolder,
  renameStorageFolder,
  deleteStorageFolder,
  moveStorageFile,
} from '../../../services/storage';
import { setCurrentStorageFolder, clearCurrentStorageFolder } from '../../../store/currentStorageFolderSlice';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';

type SortKey = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';

const VALID_CATEGORIES: StorageCategory[] = ['images', 'audios', 'videos', '3d-models'];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc',  label: 'Oldest first' },
  { value: 'name-asc',  label: 'Name A→Z' },
  { value: 'name-desc', label: 'Name Z→A' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc',  label: 'Smallest first' },
];

const categoryIcon: Record<StorageCategory, typeof faImage> = {
  images: faImage,
  audios: faHeadphones,
  videos: faVideo,
  '3d-models': faCubes,
};

const categoryLabel: Record<StorageCategory, string> = {
  images: 'Images',
  audios: 'Audios',
  videos: 'Videos',
  '3d-models': '3D Models',
};

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes) || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const EXTENSION_MIME: Record<string, string> = {
  glb: 'model/gltf-binary', gltf: 'model/gltf+json', obj: 'model/obj',
  fbx: 'application/octet-stream', stl: 'model/stl', ply: 'model/ply',
};

function resolveContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MIME[ext] ?? 'application/octet-stream';
}

function detectCategory(file: File): StorageCategory | null {
  const t = file.type;
  if (t.startsWith('image/')) return 'images';
  if (t.startsWith('audio/')) return 'audios';
  if (t.startsWith('video/')) return 'videos';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && ['glb', 'gltf', 'obj', 'fbx', 'stl', 'ply'].includes(ext)) return '3d-models';
  return null;
}

function sortFiles(files: StorageFile[], key: SortKey): StorageFile[] {
  return [...files].sort((a, b) => {
    switch (key) {
      case 'date-desc': return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      case 'date-asc':  return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      case 'name-asc':  return a.displayName.localeCompare(b.displayName);
      case 'name-desc': return b.displayName.localeCompare(a.displayName);
      case 'size-desc': return (b.size || 0) - (a.size || 0);
      case 'size-asc':  return (a.size || 0) - (b.size || 0);
      default: return 0;
    }
  });
}

export const StorageDrive = () => {
  const { id: projectId, connId, segment } = useParams<{
    id: string; connId: string; segment?: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // segment is either a category ('images', ...) or a folderId (UUID)
  const isCategory = (s?: string): s is StorageCategory =>
    VALID_CATEGORIES.includes(s as StorageCategory);

  const currentFolderId  = segment && !isCategory(segment) ? segment : null;
  const segmentCategory  = isCategory(segment) ? segment : undefined;

  const [activeCategory, setActiveCategory]       = useState<StorageCategory | 'all'>(() => segmentCategory ?? 'all');
  const [files, setFiles]                         = useState<StorageFile[]>([]);
  const [folders, setFolders]                     = useState<StorageFolder[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [foldersLoading, setFoldersLoading]       = useState(false);
  const [viewMode, setViewMode]                   = useState<'grid' | 'list'>(
    () => (localStorage.getItem('streamby-drive-view') as 'grid' | 'list') ?? 'grid',
  );
  const [sortKey, setSortKey]                     = useState<SortKey>('date-desc');
  const [search, setSearch]                       = useState('');
  const [selectedItem, setSelectedItem]           = useState<string | null>(null);
  const [uploadCat, setUploadCat]                 = useState<StorageCategory | null>(null);
  const [uploadMenuOpen, setUploadMenuOpen]       = useState(false);
  const [bgCtx, setBgCtx]                         = useState<{ x: number; y: number } | null>(null);
  const [folderCtx, setFolderCtx]                 = useState<{ id: string; name: string; x: number; y: number } | null>(null);
  const [folderCtxConfirm, setFolderCtxConfirm]   = useState(false);
  const [renamingFolderId, setRenamingFolderId]   = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [dragOverFolderId, setDragOverFolderId]   = useState<string | null>(null);
  const [uploadingFolderIds, setUploadingFolderIds] = useState<Set<string>>(new Set());
  const [bgDragOver, setBgDragOver]               = useState(false);
  const [moveItem, setMoveItem]                   = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
  const uploadMenuRef        = useRef<HTMLDivElement>(null);
  const bgCtxRef             = useRef<HTMLUListElement>(null);
  const folderCtxRef         = useRef<HTMLUListElement>(null);
  const renameFolderInputRef = useRef<HTMLInputElement>(null);

  // Sync category and reset state when segment changes (category switch or folder navigation)
  useEffect(() => {
    setActiveCategory(segmentCategory ?? 'all');
    setSelectedItem(null);
    setSearch('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment]);

  // Sync current folder name to Redux for breadcrumb
  useEffect(() => {
    if (!currentFolderId || !projectId || !connId) {
      dispatch(clearCurrentStorageFolder());
      return;
    }
    getStorageFolderById(projectId, connId, currentFolderId)
      .then(folder => { if (folder) dispatch(setCurrentStorageFolder(folder)); })
      .catch((error: any) => dispatch(addApiResponse({ message: error.message || 'Failed to load folder.', type: 'error' })));
  }, [currentFolderId, projectId, connId, dispatch]);

  // Auto-focus + select-all when entering rename mode
  useEffect(() => {
    if (renamingFolderId) {
      renameFolderInputRef.current?.focus();
      renameFolderInputRef.current?.select();
    }
  }, [renamingFolderId]);

  // Close folder context menu on outside click / Escape
  useEffect(() => {
    if (!folderCtx) return;
    const onDown = (e: MouseEvent) => {
      if (folderCtxRef.current && !folderCtxRef.current.contains(e.target as Node)) {
        setFolderCtx(null); setFolderCtxConfirm(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFolderCtx(null); setFolderCtxConfirm(false); }
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [folderCtx]);

  // Close upload dropdown on outside click
  useEffect(() => {
    if (!uploadMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node))
        setUploadMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [uploadMenuOpen]);

  // Close background context menu on outside click / Escape
  useEffect(() => {
    if (!bgCtx) return;
    const onDown = (e: MouseEvent) => {
      if (bgCtxRef.current && !bgCtxRef.current.contains(e.target as Node)) setBgCtx(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBgCtx(null); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [bgCtx]);

  const fetchFiles = useCallback(async () => {
    if (!projectId || !connId) return;
    setLoading(true);
    try {
      if (activeCategory === 'all') {
        const results = await Promise.all(VALID_CATEGORIES.map(c => getStorageFiles(projectId, connId, c)));
        setFiles(results.flat());
      } else {
        setFiles((await getStorageFiles(projectId, connId, activeCategory)) ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, connId, activeCategory]);

  const fetchFolders = useCallback(async () => {
    if (!projectId || !connId || activeCategory !== 'all') { setFolders([]); return; }
    setFoldersLoading(true);
    try {
      setFolders((await getStorageFolders(projectId, connId, currentFolderId)) ?? []);
    } finally {
      setFoldersLoading(false);
    }
  }, [projectId, connId, activeCategory, currentFolderId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  useEffect(() => { fetchFolders(); }, [fetchFolders]);
  useEffect(() => { localStorage.setItem('streamby-drive-view', viewMode); }, [viewMode]);

  const handleDelete = useCallback(async (id: string) => {
    if (!projectId || !connId) return;
    try {
      await deleteStorageFile(projectId, connId, id);
      setFiles(prev => prev.filter(f => f.id !== id));
      setSelectedItem(prev => (prev === id ? null : prev));
      dispatch(addApiResponse({ message: 'File deleted.', type: 'success' }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete file.', type: 'error' }));
    }
  }, [projectId, connId, dispatch]);

  const handleRename = useCallback(async (id: string, displayName: string) => {
    if (!projectId || !connId) return;
    try {
      const updated = await renameStorageFile(projectId, connId, id, displayName);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, displayName: updated.displayName } : f));
      dispatch(addApiResponse({ message: 'File renamed.', type: 'success' }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to rename file.', type: 'error' }));
    }
  }, [projectId, connId, dispatch]);

  const handleReplace = useCallback(async (id: string, file: File) => {
    if (!projectId || !connId) return;
    try {
      const { url } = await getStorageReplaceUrl(projectId, connId, id, file.type, file.name);
      await uploadToPresignedUrl(url, file, file.type);
      await fetchFiles();
      dispatch(addApiResponse({ message: 'File replaced.', type: 'success' }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to replace file.', type: 'error' }));
    }
  }, [projectId, connId, fetchFiles, dispatch]);

  const handleCreateFolder = useCallback(async () => {
    if (!projectId || !connId) return;
    try {
      const folder = await createStorageFolder(projectId, connId, 'New folder', currentFolderId);
      setFolders(prev => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
      setRenamingFolderId(folder.id);
      setRenameFolderValue(folder.name);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to create folder.', type: 'error' }));
    }
  }, [projectId, connId, currentFolderId, dispatch]);

  const openFolder = useCallback((folder: StorageFolder) => {
    navigate(`/project/${projectId}/storage/${connId}/${folder.id}`);
  }, [navigate, projectId, connId]);

  const handleFolderContextMenu = (e: React.MouseEvent, folder: StorageFolder) => {
    e.preventDefault();
    setSelectedItem(folder.id);
    const x = e.clientX + 192 > window.innerWidth ? e.clientX - 192 : e.clientX;
    const y = e.clientY + 100 > window.innerHeight ? e.clientY - 100 : e.clientY;
    setFolderCtx({ id: folder.id, name: folder.name, x, y });
    setFolderCtxConfirm(false);
  };

  const handleFolderCtxRename = () => {
    if (!folderCtx) return;
    setRenamingFolderId(folderCtx.id);
    setRenameFolderValue(folderCtx.name);
    setFolderCtx(null);
    setFolderCtxConfirm(false);
  };

  const handleFolderCtxDelete = async () => {
    if (!folderCtx || !projectId || !connId) return;
    if (!folderCtxConfirm) { setFolderCtxConfirm(true); return; }
    try {
      await deleteStorageFolder(projectId, connId, folderCtx.id);
      setFolders(prev => prev.filter(f => f.id !== folderCtx.id));
      setFolderCtx(null);
      setFolderCtxConfirm(false);
      dispatch(addApiResponse({ message: 'Folder deleted.', type: 'success' }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete folder.', type: 'error' }));
      setFolderCtx(null);
      setFolderCtxConfirm(false);
    }
  };

  const commitFolderRename = async () => {
    if (!renamingFolderId || !projectId || !connId) return;
    const trimmed = renameFolderValue.trim();
    const original = folders.find(f => f.id === renamingFolderId)?.name;
    setRenamingFolderId(null);
    if (!trimmed || trimmed === original) return;
    try {
      const updated = await renameStorageFolder(projectId, connId, renamingFolderId, trimmed);
      setFolders(prev =>
        prev.map(f => f.id === renamingFolderId ? { ...f, name: updated.name } : f)
            .sort((a, b) => a.name.localeCompare(b.name)),
      );
      dispatch(addApiResponse({ message: 'Folder renamed.', type: 'success' }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to rename folder.', type: 'error' }));
    }
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as Element).closest('[data-file]')) setSelectedItem(null);
  };

  const handleContentContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (activeCategory !== 'all') return;
    if ((e.target as Element).closest('[data-file]')) return;
    const x = e.clientX + 192 > window.innerWidth ? e.clientX - 192 : e.clientX;
    const y = e.clientY + 100 > window.innerHeight ? e.clientY - 100 : e.clientY;
    setBgCtx({ x, y });
  };

  const uploadFilesToDestination = useCallback(async (osFiles: File[], targetFolderId: string | null) => {
    if (!projectId || !connId || osFiles.length === 0) return;
    try {
      await Promise.all(osFiles.map(async file => {
        const category = detectCategory(file);
        if (!category) return;
        const contentType = resolveContentType(file);
        const { url, fileId } = await getStorageUploadUrl(projectId, connId, category, file.name, contentType);
        await uploadToPresignedUrl(url, file, contentType);
        if (targetFolderId) await moveStorageFile(projectId, connId, fileId, targetFolderId);
      }));
      await fetchFiles();
      dispatch(addApiResponse({ message: 'Files uploaded.', type: 'success' }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to upload files.', type: 'error' }));
    }
  }, [projectId, connId, fetchFiles, dispatch]);

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(folderId);
    setBgDragOver(false);
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverFolderId(null);
  };

  const handleFolderDrop = useCallback(async (e: React.DragEvent, folder: StorageFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    if (!projectId || !connId) return;

    // Internal file move
    const internalId = e.dataTransfer.getData('application/streamby-file');
    if (internalId) {
      try {
        await moveStorageFile(projectId, connId, internalId, folder.id);
        setFiles(prev => prev.map(f => f.id === internalId ? { ...f, folderId: folder.id } : f));
        dispatch(addApiResponse({ message: 'File moved.', type: 'success' }));
      } catch (error: any) {
        dispatch(addApiResponse({ message: error.message || 'Failed to move file.', type: 'error' }));
      }
      return;
    }

    // OS file upload into folder
    const osFiles = Array.from(e.dataTransfer.files);
    if (osFiles.length === 0) return;
    setUploadingFolderIds(prev => new Set(prev).add(folder.id));
    try {
      await uploadFilesToDestination(osFiles, folder.id);
    } finally {
      setUploadingFolderIds(prev => { const n = new Set(prev); n.delete(folder.id); return n; });
    }
  }, [projectId, connId, uploadFilesToDestination, dispatch]);

  const handleBgDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!(e.target as Element).closest('[data-file]')) setBgDragOver(true);
  };

  const handleBgDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setBgDragOver(false);
  };

  const handleBgDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setBgDragOver(false);
    if ((e.target as Element).closest('[data-file]')) return;
    const internalId = e.dataTransfer.getData('application/streamby-file');
    if (internalId) return; // internal drags go to folders only
    const osFiles = Array.from(e.dataTransfer.files);
    if (osFiles.length === 0) return;
    await uploadFilesToDestination(osFiles, currentFolderId);
  }, [uploadFilesToDestination, currentFolderId]);

  const displayFiles = useMemo(() => {
    let source = files;
    if (activeCategory === 'all') source = files.filter(f => (f.folderId ?? null) === currentFolderId);
    const q = search.toLowerCase();
    return sortFiles(q ? source.filter(f => f.displayName.toLowerCase().includes(q)) : source, sortKey);
  }, [files, search, sortKey, activeCategory, currentFolderId]);

  const selectedFile = useMemo(
    () => displayFiles.find(f => f.id === selectedItem) ?? null,
    [displayFiles, selectedItem],
  );

  // Keyboard navigation
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (bgCtx || folderCtx || renamingFolderId) return;

      if (e.key === 'Escape') { setSelectedItem(null); return; }

      const allIds = [...folders.map(f => f.id), ...displayFiles.map(f => f.id)];
      if (allIds.length === 0) return;

      if (e.key === 'Enter' && selectedItem) {
        const folder = folders.find(f => f.id === selectedItem);
        if (folder) { openFolder(folder); return; }
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();

      const cur = selectedItem ? allIds.indexOf(selectedItem) : -1;
      const next =
        e.key === 'ArrowDown' || e.key === 'ArrowRight'
          ? cur < allIds.length - 1 ? cur + 1 : 0
          : cur > 0 ? cur - 1 : allIds.length - 1;

      setSelectedItem(allIds[next]);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [folders, displayFiles, selectedItem, bgCtx, folderCtx, renamingFolderId, openFolder]);

  const isLoading = loading || foldersLoading;
  const emptyIcon  = activeCategory !== 'all' ? categoryIcon[activeCategory] : faFolder;
  const emptyLabel = activeCategory !== 'all' ? categoryLabel[activeCategory].toLowerCase() : 'files or folders';

  return (
    <div className={s.drive}>
      <div className={s.main}>

        {/* ── Toolbar ── */}
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={s.searchIcon} />
            <input
              type="text"
              placeholder="Search files…"
              className={s.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={s.searchClear} onClick={() => setSearch('')} type="button">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          <DropdownInput
            value={sortKey}
            onChange={v => setSortKey(v as SortKey)}
            options={SORT_OPTIONS}
            dropdownMinWidth={160}
          />

          <div className={s.viewToggle}>
            <button
              type="button"
              className={`${s.viewBtn} ${viewMode === 'grid' ? s.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <FontAwesomeIcon icon={faTableCells} />
            </button>
            <button
              type="button"
              className={`${s.viewBtn} ${viewMode === 'list' ? s.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <FontAwesomeIcon icon={faList} />
            </button>
          </div>

          {activeCategory === 'all' ? (
            <div className={s.uploadWrap} ref={uploadMenuRef}>
              <button type="button" className={s.uploadBtn} onClick={() => setUploadMenuOpen(v => !v)}>
                <FontAwesomeIcon icon={faCloudArrowUp} />
                Upload
                <FontAwesomeIcon icon={faChevronDown} className={s.uploadChevron} />
              </button>
              {uploadMenuOpen && (
                <div className={s.uploadMenu}>
                  {VALID_CATEGORIES.map(cat => (
                    <button
                      key={cat} type="button" className={s.uploadMenuItem}
                      onClick={() => { setUploadCat(cat); setUploadMenuOpen(false); }}
                    >
                      <FontAwesomeIcon icon={categoryIcon[cat]} className={s.uploadMenuIcon} />
                      {categoryLabel[cat]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button" className={s.uploadBtn}
              onClick={() => setUploadCat(activeCategory as StorageCategory)}
            >
              <FontAwesomeIcon icon={faCloudArrowUp} />
              Upload
            </button>
          )}
        </div>

        {/* ── Content ── */}
        <div
          className={`${s.content} ${bgDragOver ? s.contentDragOver : ''}`}
          onClick={handleContentClick}
          onContextMenu={handleContentContextMenu}
          onDragOver={handleBgDragOver}
          onDragLeave={handleBgDragLeave}
          onDrop={handleBgDrop}
        >
          {isLoading ? (
            viewMode === 'grid' ? (
              <div className={s.grid}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`${s.gridSkeleton} ${skeleton.skeleton}`} />
                ))}
              </div>
            ) : (
              <div className={s.list}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`${s.listSkeleton} ${skeleton.skeleton}`} />
                ))}
              </div>
            )
          ) : folders.length === 0 && displayFiles.length === 0 ? (
            <div className={s.empty}>
              <FontAwesomeIcon icon={emptyIcon} className={s.emptyIcon} />
              <p className={s.emptyText}>
                {search ? `No files matching "${search}"` : `No ${emptyLabel} yet`}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={s.grid}>
              {folders.map(folder => (
                <div
                  key={folder.id}
                  className={`${s.folderCard} ${selectedItem === folder.id ? s.folderCardSelected : ''} ${dragOverFolderId === folder.id ? s.folderCardDragOver : ''} ${uploadingFolderIds.has(folder.id) ? s.folderCardUploading : ''}`}
                  data-file="true"
                  onClick={() => setSelectedItem(folder.id)}
                  onDoubleClick={() => { if (renamingFolderId !== folder.id) openFolder(folder); }}
                  onContextMenu={e => handleFolderContextMenu(e, folder)}
                  onDragOver={e => handleFolderDragOver(e, folder.id)}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={e => handleFolderDrop(e, folder)}
                >
                  <FontAwesomeIcon icon={faFolder} className={s.folderCardIcon} />
                  {renamingFolderId === folder.id ? (
                    <input
                      ref={renameFolderInputRef}
                      className={s.folderCardRenameInput}
                      value={renameFolderValue}
                      onChange={e => setRenameFolderValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitFolderRename();
                        if (e.key === 'Escape') setRenamingFolderId(null);
                      }}
                      onBlur={commitFolderRename}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className={s.folderCardName}>{folder.name}</span>
                  )}
                </div>
              ))}
              {displayFiles.map(file => (
                <div
                  key={file.id}
                  data-file="true"
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('application/streamby-file', file.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <StorageCard
                    file={file}
                    category={file.category as StorageCategory}
                    selected={selectedItem === file.id}
                    onSelect={f => setSelectedItem(f.id)}
                    onDelete={handleDelete}
                    onRename={handleRename}
                    onReplace={handleReplace}
                    onMove={() => setMoveItem({ type: 'file', id: file.id, name: file.displayName })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={s.list}>
              <div className={s.listHeader}>
                <span className={s.listHeaderName}>Name</span>
                <span className={s.listHeaderBadge}>Type</span>
                <span className={s.listHeaderSize}>Size</span>
                <span className={s.listHeaderDate}>Modified</span>
              </div>
              {folders.map(folder => (
                <div
                  key={folder.id}
                  role="button"
                  tabIndex={0}
                  data-file="true"
                  className={`${s.listRow} ${selectedItem === folder.id ? s.listRowSelected : ''} ${dragOverFolderId === folder.id ? s.folderCardDragOver : ''} ${uploadingFolderIds.has(folder.id) ? s.folderCardUploading : ''}`}
                  onClick={() => setSelectedItem(folder.id)}
                  onDoubleClick={() => { if (renamingFolderId !== folder.id) openFolder(folder); }}
                  onKeyDown={e => { if (e.key === 'Enter' && renamingFolderId !== folder.id) openFolder(folder); }}
                  onContextMenu={e => handleFolderContextMenu(e, folder)}
                  onDragOver={e => handleFolderDragOver(e, folder.id)}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={e => handleFolderDrop(e, folder)}
                >
                  <FontAwesomeIcon icon={faFolder} className={`${s.listIcon} ${s.folderIcon}`} />
                  {renamingFolderId === folder.id ? (
                    <input
                      ref={renameFolderInputRef}
                      className={s.folderListRenameInput}
                      value={renameFolderValue}
                      onChange={e => setRenameFolderValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitFolderRename();
                        if (e.key === 'Escape') setRenamingFolderId(null);
                      }}
                      onBlur={commitFolderRename}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className={s.listName}>{folder.name}</span>
                  )}
                  <span className={s.listBadge}>Folder</span>
                  <span className={s.listSize}>—</span>
                  <span className={s.listDate}>{new Date(folder.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {displayFiles.map(file => (
                <div
                  key={file.id}
                  data-file="true"
                  role="button"
                  tabIndex={0}
                  draggable
                  className={`${s.listRow} ${selectedItem === file.id ? s.listRowSelected : ''}`}
                  onClick={() => setSelectedItem(file.id)}
                  onKeyDown={e => { if (e.key === 'Enter') setSelectedItem(file.id); }}
                  onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setMoveItem({ type: 'file', id: file.id, name: file.displayName }); }}
                  onDragStart={e => {
                    e.dataTransfer.setData('application/streamby-file', file.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <FontAwesomeIcon
                    icon={categoryIcon[file.category as StorageCategory] ?? faCubes}
                    className={s.listIcon}
                  />
                  <span className={s.listName}>{file.displayName}</span>
                  <span className={s.listBadge}>{categoryLabel[file.category as StorageCategory] ?? file.category}</span>
                  <span className={s.listSize}>{formatBytes(file.size)}</span>
                  <span className={s.listDate}>
                    {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Upload modal ── */}
      {uploadCat && projectId && connId && (
        <UploadModal
          projectId={projectId}
          connId={connId}
          category={uploadCat}
          onSuccess={() => { setUploadCat(null); fetchFiles(); }}
          onClose={() => setUploadCat(null)}
        />
      )}

      {/* ── Background context menu ── */}
      {bgCtx && (
        <ul ref={bgCtxRef} className={s.bgCtxMenu} style={{ top: bgCtx.y, left: bgCtx.x }}>
          <li className={s.bgCtxItem} onClick={() => { setBgCtx(null); handleCreateFolder(); }}>
            <FontAwesomeIcon icon={faFolderPlus} className={s.bgCtxIcon} />
            New folder
          </li>
        </ul>
      )}

      {/* ── Folder context menu ── */}
      {folderCtx && (
        <ul ref={folderCtxRef} className={s.bgCtxMenu} style={{ top: folderCtx.y, left: folderCtx.x }}>
          <li className={s.bgCtxItem} onClick={handleFolderCtxRename}>
            <FontAwesomeIcon icon={faPencil} className={s.bgCtxIcon} />
            Rename
          </li>
          <li className={s.bgCtxItem} onClick={() => {
            setMoveItem({ type: 'folder', id: folderCtx.id, name: folderCtx.name });
            setFolderCtx(null);
          }}>
            <FontAwesomeIcon icon={faArrowRight} className={s.bgCtxIcon} />
            Move
          </li>
          <li className={s.bgCtxDivider} />
          <li
            className={`${s.bgCtxItem} ${folderCtxConfirm ? s.bgCtxItemConfirm : s.bgCtxItemDanger}`}
            onClick={handleFolderCtxDelete}
          >
            <FontAwesomeIcon icon={faTrash} className={s.bgCtxIcon} />
            {folderCtxConfirm ? 'Confirm delete' : 'Delete'}
          </li>
        </ul>
      )}

      {/* ── Move modal ── */}
      {moveItem && projectId && connId && (
        <MoveModal
          projectId={projectId}
          activeConnId={connId}
          itemType={moveItem.type}
          itemId={moveItem.id}
          itemName={moveItem.name}
          onSuccess={() => { setMoveItem(null); fetchFiles(); fetchFolders(); }}
          onClose={() => setMoveItem(null)}
        />
      )}

      {/* ── File detail panel ── */}
      <div className={`${s.detail} ${selectedFile ? s.detailOpen : ''}`}>
        {selectedFile && (
          <FileDetailPanel
            file={selectedFile}
            category={selectedFile.category as StorageCategory}
            onClose={() => setSelectedItem(null)}
            onDelete={handleDelete}
            onUpdate={handleReplace}
            onRename={handleRename}
          />
        )}
      </div>
    </div>
  );
};
