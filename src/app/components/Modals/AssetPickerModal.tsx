import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faImage, faHeadphones, faVideo, faCubes,
  faLayerGroup, faCheck, faMagnifyingGlass, faSpinner,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';
import { getStorageFiles, getStorageUploadUrl, uploadToPresignedUrl } from '../../../services/storage';
import s from './AssetPickerModal.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

// ─── Config ───────────────────────────────────────────────────────────────

interface AssetPickerModalProps {
  projectId: string;
  onInsert: (files: StorageFile[]) => void;
  onClose: () => void;
}

const CATEGORIES: { key: StorageCategory; label: string; icon: typeof faImage; accept: string }[] = [
  { key: 'images',    label: 'Images', icon: faImage,      accept: 'image/*' },
  { key: 'videos',    label: 'Videos', icon: faVideo,      accept: 'video/*' },
  { key: 'audios',    label: 'Audios', icon: faHeadphones, accept: 'audio/*' },
  { key: '3d-models', label: '3D',     icon: faCubes,      accept: '.glb,.gltf,.obj,.fbx,.stl,.ply' },
];

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── File tile ─────────────────────────────────────────────────────────────

function FileTile({ file, selected, onToggle }: {
  file: StorageFile; selected: boolean; onToggle: () => void;
}) {
  return (
    <div
      className={`${s.tile} ${selected ? s.tileSelected : ''}`}
      onClick={onToggle}
      title={file.displayName}
    >
      <div className={s.tileThumb}>
        {file.category === 'images' ? (
          <img src={file.url} alt={file.displayName} className={s.tileImg} loading="lazy" />
        ) : (
          <div className={s.tileIcon}>
            <FontAwesomeIcon
              icon={
                file.category === 'videos' ? faVideo
              : file.category === 'audios' ? faHeadphones
              : faCubes
              }
            />
          </div>
        )}
        {selected && (
          <div className={s.tileCheckmark}>
            <FontAwesomeIcon icon={faCheck} />
          </div>
        )}
      </div>
      <p className={s.tileName}>{file.displayName}</p>
      <span className={s.tileSize}>{formatBytes(file.size)}</span>
    </div>
  );
}

// ─── AssetPickerModal ─────────────────────────────────────────────────────

export function AssetPickerModal({ projectId, onInsert, onClose }: AssetPickerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState<StorageCategory>('images');
  const [cache,    setCache]    = useState<Partial<Record<StorageCategory, StorageFile[]>>>({});
  const [loading,  setLoading]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchCategory = useCallback((cat: StorageCategory) => {
    setLoading(true);
    getStorageFiles(projectId, 'builtin', cat).then(files => {
      setCache(prev => ({ ...prev, [cat]: files ?? [] }));
      setLoading(false);
    });
  }, [projectId]);

  // Fetch on first visit to a category
  useEffect(() => {
    if (cache[activeCategory] !== undefined) return;
    fetchCategory(activeCategory);
  }, [activeCategory, cache, fetchCategory]);

  const files = cache[activeCategory] ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? files.filter(f => f.displayName.toLowerCase().includes(q)) : files;
  }, [files, search]);

  const toggleFile = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleInsert = useCallback(() => {
    const allFiles = (Object.values(cache).flat() as StorageFile[]);
    const picks = allFiles.filter(f => selected.has(f.id));
    if (picks.length > 0) onInsert(picks);
  }, [cache, selected, onInsert]);

  // ─── Upload ───────────────────────────────────────────────────────────────

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';

    setUploading(true);
    let succeeded = 0;

    for (const file of files) {
      try {
        setUploadProgress(`Uploading ${file.name}…`);
        const { url } = await getStorageUploadUrl(projectId, 'builtin', activeCategory, file.name, file.type);
        await uploadToPresignedUrl(url, file, file.type);
        succeeded++;
      } catch {
        // error toast handled inside service
      }
    }

    setUploading(false);
    setUploadProgress(null);

    if (succeeded > 0) {
      // Invalidate cache for this category and re-fetch
      setCache(prev => { const next = { ...prev }; delete next[activeCategory]; return next; });
    }
  }, [projectId, activeCategory]);

  const activeCat = CATEGORIES.find(c => c.key === activeCategory)!;
  const selectedCount = selected.size;

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={activeCat.accept}
          className={s.hiddenInput}
          onChange={handleFileChange}
        />

        {/* Header */}
        <div className={s.header}>
          <span className={s.headerTitle}>
            <FontAwesomeIcon icon={faLayerGroup} />
            Insert Asset
          </span>
          <button className={s.closeBtn} type="button" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Tabs + Upload button */}
        <div className={s.tabs}>
          <div className={s.tabList}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                type="button"
                className={`${s.tab} ${activeCategory === cat.key ? s.tabActive : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <FontAwesomeIcon icon={cat.icon} />
                {cat.label}
                {cache[cat.key] !== undefined && (
                  <span className={s.tabCount}>{cache[cat.key]!.length}</span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={s.uploadBtn}
            onClick={handleUploadClick}
            disabled={uploading}
            title={`Upload ${activeCat.label.toLowerCase()} to project`}
          >
            <FontAwesomeIcon icon={uploading ? faSpinner : faUpload} spin={uploading} />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>

        {/* Upload progress */}
        {uploadProgress && (
          <div className={s.uploadProgressBar}>
            <FontAwesomeIcon icon={faSpinner} spin />
            {uploadProgress}
          </div>
        )}

        {/* Search */}
        <div className={s.searchRow}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={s.searchIcon} />
          <input
            type="text"
            className={s.searchInput}
            placeholder="Filter by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className={s.searchClear} onClick={() => setSearch('')}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        {/* Grid */}
        <div className={s.grid}>
          {loading ? (
            <div className={s.loadingRow}>
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Loading…</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className={s.emptyNote}>
              {search ? 'No files match your search.' : `No ${activeCat.label.toLowerCase()} in this project.`}
            </p>
          ) : (
            filtered.map(file => (
              <FileTile
                key={file.id}
                file={file}
                selected={selected.has(file.id)}
                onToggle={() => toggleFile(file.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className={s.footer}>
          <span className={s.selectionInfo}>
            {selectedCount > 0
              ? `${selectedCount} file${selectedCount > 1 ? 's' : ''} selected`
              : 'Click files to select'}
          </span>
          <div className={s.footerActions}>
            <SecondaryButton text="Cancel" onClick={onClose} icon={faXmark} />
            <ActionButton
              text={`Insert${selectedCount > 0 ? ` (${selectedCount})` : ''}`}
              onClick={handleInsert}
              disabled={selectedCount === 0}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
