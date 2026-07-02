import s from './FileDetailPanel.module.css';
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faCopy, faCheck, faDownload, faTrash,
  faHeadphones, faVideo, faCubes, faImage, faArrowsRotate, faPencil,
  faFileLines, faDatabase, faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';
import { RootState } from '../../../store';

interface FileDetailPanelProps {
  file: StorageFile;
  category: StorageCategory;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, file: File) => Promise<void>;
  onRename?: (id: string, displayName: string) => Promise<void>;
}

type TabId = 'info' | 'metadata' | 'jobs';

const acceptTypes: Record<StorageCategory, string> = {
  images: 'image/*',
  audios: 'audio/*',
  videos: 'video/*',
  '3d-models': '.glb,.gltf,.obj,.fbx,.stl,.ply',
};

const categoryIcon = {
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

function MetadataTab({ file }: { file: StorageFile }) {
  const fields: { label: string; value: string }[] = [
    { label: 'Content type', value: file.contentType || '—' },
    { label: 'Size', value: formatBytes(file.size) },
    { label: 'Category', value: file.category },
    { label: 'Storage key', value: file.storageKey || file.key || '—' },
    { label: 'Uploaded by', value: file.uploadedBy || '—' },
    { label: 'Created', value: file.createdAt ? new Date(file.createdAt).toLocaleString() : '—' },
    { label: 'Modified', value: file.lastModified ? new Date(file.lastModified).toLocaleString() : '—' },
  ];

  return (
    <div className={s.tabContent}>
      {fields.map(f => (
        <div key={f.label} className={s.field}>
          <p className={s.fieldLabel}>{f.label}</p>
          <p className={s.fieldValue}>{f.value}</p>
        </div>
      ))}
    </div>
  );
}

function JobsTab({ fileId }: { fileId: string }) {
  const jobs = useSelector((state: RootState) => state.currentJob.jobs);
  const related = Object.values(jobs).filter(j => j.assetId === fileId);

  if (!related.length) {
    return (
      <div className={s.tabEmpty}>
        <FontAwesomeIcon icon={faBolt} className={s.tabEmptyIcon} />
        <p>No active jobs for this file.</p>
      </div>
    );
  }

  return (
    <div className={s.tabContent}>
      {related.map(job => (
        <div key={job.jobId} className={s.jobRow}>
          <div className={s.jobInfo}>
            <span className={s.jobType}>{job.jobType}</span>
            <span className={s.jobStage}>{job.stage}</span>
          </div>
          <div className={s.jobProgress}>
            <div className={s.jobProgressTrack}>
              <div
                className={`${s.jobProgressFill} ${job.error ? s.jobProgressError : job.progress >= 100 ? s.jobProgressDone : ''}`}
                style={{ width: `${Math.min(100, job.progress)}%` }}
              />
            </div>
            <span className={s.jobPercent}>{job.progress}%</span>
          </div>
          {job.error && <p className={s.jobError}>{job.error}</p>}
        </div>
      ))}
    </div>
  );
}

export function FileDetailPanel({ file, category, onClose, onDelete, onUpdate, onRename }: FileDetailPanelProps) {
  const [activeTab, setActiveTab]     = useState<TabId>('info');
  const [copied, setCopied]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updating, setUpdating]       = useState(false);
  const [renaming, setRenaming]       = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfirmDelete(false);
    setRenaming(false);
    setActiveTab('info');
  }, [file.id]);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const cleanUrl = (url: string) => url.split('?')[0];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cleanUrl(file.url));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    e.target.value = '';
    setUpdating(true);
    try {
      await onUpdate(file.id, picked);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(file.id);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  const startRename = () => {
    setRenameValue(file.displayName);
    setRenaming(true);
  };

  const commitRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === file.displayName || !onRename) {
      setRenaming(false);
      return;
    }
    setRenameLoading(true);
    try {
      await onRename(file.id, trimmed);
    } finally {
      setRenameLoading(false);
      setRenaming(false);
    }
  };

  const handleRenameKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setRenaming(false);
  };

  const TABS: { id: TabId; icon: typeof faFileLines; label: string }[] = [
    { id: 'info',     icon: faFileLines, label: 'Info' },
    { id: 'metadata', icon: faDatabase,  label: 'Metadata' },
    { id: 'jobs',     icon: faBolt,      label: 'Jobs' },
  ];

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <span className={s.headerTitle}>File details</span>
        <button className={s.closeBtn} onClick={onClose} title="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className={s.preview}>
        {category === 'images' ? (
          <img src={file.url} alt={file.displayName} className={s.previewImage} />
        ) : (
          <div className={s.previewIcon}>
            <FontAwesomeIcon icon={categoryIcon[category]} className={s.fileIcon} />
          </div>
        )}
      </div>

      <div className={s.info}>
        {renaming ? (
          <div className={s.renameRow}>
            <input
              ref={renameInputRef}
              className={s.renameInput}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleRenameKey}
              disabled={renameLoading}
            />
          </div>
        ) : (
          <div className={s.fileNameRow}>
            <p className={s.fileName} title={file.displayName}>{file.displayName}</p>
            {onRename && (
              <button className={s.renameBtn} onClick={startRename} title="Rename">
                <FontAwesomeIcon icon={faPencil} />
              </button>
            )}
          </div>
        )}

        <div className={s.urlRow}>
          <p className={s.urlText} title={cleanUrl(file.url)}>{cleanUrl(file.url)}</p>
          <button className={s.copyBtn} onClick={handleCopy} title="Copy URL">
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className={s.tabBar}>
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              className={`${s.tabBtn} ${activeTab === t.id ? s.tabBtnActive : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <FontAwesomeIcon icon={t.icon} className={s.tabIcon} />
              {t.label}
            </button>
          ))}
        </div>

        <div className={s.tabBody}>
          {activeTab === 'info' && (
            <div className={s.tabContent}>
              <div className={s.field}>
                <p className={s.fieldLabel}>Size</p>
                <p className={s.fieldValue}>{formatBytes(file.size)}</p>
              </div>
              <div className={s.field}>
                <p className={s.fieldLabel}>Type</p>
                <p className={s.fieldValue}>{file.contentType || '—'}</p>
              </div>
              {file.lastModified && (
                <div className={s.field}>
                  <p className={s.fieldLabel}>Modified</p>
                  <p className={s.fieldValue}>{new Date(file.lastModified).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'metadata' && <MetadataTab file={file} />}
          {activeTab === 'jobs' && <JobsTab fileId={file.id} />}
        </div>
      </div>

      <div className={s.actions}>
        <input
          ref={replaceInputRef}
          type="file"
          accept={acceptTypes[category]}
          className={s.hiddenInput}
          onChange={handleReplace}
        />
        <a href={file.url} download={file.displayName} className={s.actionBtn}>
          <FontAwesomeIcon icon={faDownload} />
          Download
        </a>
        <button
          className={s.actionBtn}
          onClick={() => replaceInputRef.current?.click()}
          disabled={updating}
        >
          <FontAwesomeIcon icon={faArrowsRotate} />
          {updating ? 'Replacing…' : 'Replace'}
        </button>
        <button
          className={`${s.actionBtn} ${confirmDelete ? s.actionBtnConfirm : s.actionBtnDanger}`}
          onClick={handleDelete}
          disabled={updating}
        >
          <FontAwesomeIcon icon={faTrash} />
          {confirmDelete ? 'Confirm?' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
