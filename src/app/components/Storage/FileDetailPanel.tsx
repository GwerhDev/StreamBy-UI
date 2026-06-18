import s from './FileDetailPanel.module.css';
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faCopy, faCheck, faDownload, faTrash,
  faHeadphones, faVideo, faCubes, faImage, faArrowsRotate, faPencil,
} from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';

interface FileDetailPanelProps {
  file: StorageFile;
  category: StorageCategory;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, file: File) => Promise<void>;
  onRename?: (id: string, displayName: string) => Promise<void>;
}

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

export function FileDetailPanel({ file, category, onClose, onDelete, onUpdate, onRename }: FileDetailPanelProps) {
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

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <span className={s.headerTitle}>Details</span>
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

        <div className={s.fields}>
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

        <div className={s.urlRow}>
          <p className={s.urlText} title={cleanUrl(file.url)}>{cleanUrl(file.url)}</p>
          <button className={s.copyBtn} onClick={handleCopy} title="Copy URL">
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
          </button>
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
