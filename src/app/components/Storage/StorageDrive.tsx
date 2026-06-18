import s from './StorageDrive.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage, faHeadphones, faVideo, faCubes, faCloudArrowUp,
  faTableCells, faList, faMagnifyingGlass, faChevronDown, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';
import { StorageCard } from './StorageCard';
import { FileDetailPanel } from './FileDetailPanel';
import { UploadModal } from '../Modals/UploadModal';
import {
  getStorageFiles,
  deleteStorageFile,
  renameStorageFile,
  getStorageReplaceUrl,
  uploadToPresignedUrl,
} from '../../../services/storage';

type SortKey = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';

const VALID_CATEGORIES: StorageCategory[] = ['images', 'audios', 'videos', '3d-models'];

const CATEGORIES = [
  { key: 'images'    as StorageCategory, label: 'Images',    icon: faImage },
  { key: 'audios'    as StorageCategory, label: 'Audios',    icon: faHeadphones },
  { key: 'videos'    as StorageCategory, label: 'Videos',    icon: faVideo },
  { key: '3d-models' as StorageCategory, label: '3D Models', icon: faCubes },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc',  label: 'Newest first' },
  { value: 'date-asc',   label: 'Oldest first' },
  { value: 'name-asc',   label: 'Name A→Z' },
  { value: 'name-desc',  label: 'Name Z→A' },
  { value: 'size-desc',  label: 'Largest first' },
  { value: 'size-asc',   label: 'Smallest first' },
];

const categoryIcon: Record<StorageCategory, typeof faImage> = {
  images: faImage,
  audios: faHeadphones,
  videos: faVideo,
  '3d-models': faCubes,
};

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes) || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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
  const { id: projectId, connId, contentType } = useParams<{ id: string; connId: string; contentType?: string }>();

  const [activeCategory, setActiveCategory] = useState<StorageCategory | 'all'>(
    VALID_CATEGORIES.includes(contentType as StorageCategory) ? (contentType as StorageCategory) : 'all',
  );
  const [files, setFiles]               = useState<StorageFile[]>([]);
  const [loading, setLoading]           = useState(true);
  const [viewMode, setViewMode]         = useState<'grid' | 'list'>(
    () => (localStorage.getItem('streamby-drive-view') as 'grid' | 'list') ?? 'grid',
  );
  const [sortKey, setSortKey]           = useState<SortKey>('date-desc');
  const [search, setSearch]             = useState('');
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [uploadCat, setUploadCat]       = useState<StorageCategory | null>(null);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const uploadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uploadMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node))
        setUploadMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [uploadMenuOpen]);

  const fetchFiles = useCallback(async () => {
    if (!projectId || !connId) return;
    setLoading(true);
    try {
      if (activeCategory === 'all') {
        const results = await Promise.all(
          VALID_CATEGORIES.map(c => getStorageFiles(projectId, connId, c)),
        );
        setFiles(results.flat());
      } else {
        const result = await getStorageFiles(projectId, connId, activeCategory);
        setFiles(result ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, connId, activeCategory]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  useEffect(() => { localStorage.setItem('streamby-drive-view', viewMode); }, [viewMode]);

  const handleDelete = useCallback(async (id: string) => {
    if (!projectId || !connId) return;
    await deleteStorageFile(projectId, connId, id);
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelectedFile(prev => (prev?.id === id ? null : prev));
  }, [projectId, connId]);

  const handleRename = useCallback(async (id: string, displayName: string) => {
    if (!projectId || !connId) return;
    const updated = await renameStorageFile(projectId, connId, id, displayName);
    if (updated) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, displayName: updated.displayName } : f));
      setSelectedFile(prev => (prev?.id === id ? { ...prev, displayName: updated.displayName } : prev));
    }
  }, [projectId, connId]);

  const handleReplace = useCallback(async (id: string, file: File) => {
    if (!projectId || !connId) return;
    const { url } = await getStorageReplaceUrl(projectId, connId, id, file.type, file.name);
    await uploadToPresignedUrl(url, file, file.type);
    await fetchFiles();
  }, [projectId, connId, fetchFiles]);

  const handleSelectCategory = useCallback((cat: StorageCategory | 'all') => {
    setActiveCategory(cat);
    setSelectedFile(null);
    setSearch('');
  }, []);

  const displayFiles = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q ? files.filter(f => f.displayName.toLowerCase().includes(q)) : files;
    return sortFiles(filtered, sortKey);
  }, [files, search, sortKey]);

  const activeMeta = CATEGORIES.find(c => c.key === activeCategory) ?? null;

  return (
    <div className={s.drive}>

      {/* ── Left sidebar ── */}
      <nav className={s.nav}>
        <button
          type="button"
          className={`${s.navItem} ${activeCategory === 'all' ? s.navItemActive : ''}`}
          onClick={() => handleSelectCategory('all')}
        >
          <FontAwesomeIcon icon={faTableCells} className={s.navIcon} />
          All files
        </button>

        <span className={s.navDivider} />

        {CATEGORIES.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            className={`${s.navItem} ${activeCategory === key ? s.navItemActive : ''}`}
            onClick={() => handleSelectCategory(key)}
          >
            <FontAwesomeIcon icon={icon} className={s.navIcon} />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Main area ── */}
      <div className={s.main}>

        {/* Toolbar */}
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

          <select
            className={s.sortSelect}
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

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
              <button
                type="button"
                className={s.uploadBtn}
                onClick={() => setUploadMenuOpen(v => !v)}
              >
                <FontAwesomeIcon icon={faCloudArrowUp} />
                Upload
                <FontAwesomeIcon icon={faChevronDown} className={s.uploadChevron} />
              </button>
              {uploadMenuOpen && (
                <div className={s.uploadMenu}>
                  {CATEGORIES.map(({ key, label, icon }) => (
                    <button
                      key={key}
                      type="button"
                      className={s.uploadMenuItem}
                      onClick={() => { setUploadCat(key); setUploadMenuOpen(false); }}
                    >
                      <FontAwesomeIcon icon={icon} className={s.uploadMenuIcon} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className={s.uploadBtn}
              onClick={() => setUploadCat(activeCategory as StorageCategory)}
            >
              <FontAwesomeIcon icon={faCloudArrowUp} />
              Upload
            </button>
          )}
        </div>

        {/* Content */}
        <div className={s.content}>
          {loading ? (
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
          ) : displayFiles.length === 0 ? (
            <div className={s.empty}>
              <FontAwesomeIcon icon={activeMeta?.icon ?? faTableCells} className={s.emptyIcon} />
              <p className={s.emptyText}>
                {search
                  ? `No files matching "${search}"`
                  : `No ${activeMeta?.label.toLowerCase() ?? 'files'} yet`}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={s.grid}>
              {displayFiles.map(file => (
                <StorageCard
                  key={file.id}
                  file={file}
                  category={file.category as StorageCategory}
                  selected={selectedFile?.id === file.id}
                  onSelect={setSelectedFile}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onReplace={handleReplace}
                />
              ))}
            </div>
          ) : (
            <div className={s.list}>
              {displayFiles.map(file => (
                <button
                  key={file.id}
                  type="button"
                  className={`${s.listRow} ${selectedFile?.id === file.id ? s.listRowSelected : ''}`}
                  onClick={() => setSelectedFile(file)}
                >
                  <FontAwesomeIcon
                    icon={categoryIcon[file.category as StorageCategory] ?? faCubes}
                    className={s.listIcon}
                  />
                  <span className={s.listName}>{file.displayName}</span>
                  <span className={s.listBadge}>{file.category}</span>
                  <span className={s.listSize}>{formatBytes(file.size)}</span>
                  <span className={s.listDate}>
                    {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : '—'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      <div className={`${s.detail} ${selectedFile ? s.detailOpen : ''}`}>
        {selectedFile && (
          <FileDetailPanel
            file={selectedFile}
            category={selectedFile.category as StorageCategory}
            onClose={() => setSelectedFile(null)}
            onDelete={handleDelete}
            onRename={handleRename}
            onUpdate={handleReplace}
          />
        )}
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
    </div>
  );
};
