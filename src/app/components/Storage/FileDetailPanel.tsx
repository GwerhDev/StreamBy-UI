import s from './FileDetailPanel.module.css';
import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faCopy, faCheck, faDownload, faTrash,
  faHeadphones, faVideo, faCubes, faImage, faArrowsRotate,
} from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';

interface FileDetailPanelProps {
  file: StorageFile;
  category: StorageCategory;
  onClose: () => void;
  onDelete: (key: string) => void;
  onUpdate: (key: string, file: File) => Promise<void>;
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
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileDetailPanel({ file, category, onClose, onDelete, onUpdate }: FileDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updating, setUpdating] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    e.target.value = '';
    setUpdating(true);
    try {
      await onUpdate(file.key, picked);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(file.key);
      onClose();
    } else {
      setConfirmDelete(true);
    }
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
          <img src={file.url} alt={file.name} className={s.previewImage} />
        ) : (
          <div className={s.previewIcon}>
            <FontAwesomeIcon icon={categoryIcon[category]} className={s.fileIcon} />
          </div>
        )}
      </div>

      <div className={s.info}>
        <p className={s.fileName} title={file.name}>{file.name}</p>

        <div className={s.fields}>
          <div className={s.field}>
            <p className={s.fieldLabel}>Size</p>
            <p className={s.fieldValue}>{formatBytes(file.size)}</p>
          </div>
          <div className={s.field}>
            <p className={s.fieldLabel}>Type</p>
            <p className={s.fieldValue}>{file.contentType}</p>
          </div>
          {file.lastModified && (
            <div className={s.field}>
              <p className={s.fieldLabel}>Modified</p>
              <p className={s.fieldValue}>{new Date(file.lastModified).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className={s.urlRow}>
          <p className={s.urlText} title={file.url}>{file.url}</p>
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
        <a href={file.url} download={file.name} className={s.actionBtn}>
          <FontAwesomeIcon icon={faDownload} />
          Download
        </a>
        <button
          className={s.actionBtn}
          onClick={() => replaceInputRef.current?.click()}
          disabled={updating}
        >
          <FontAwesomeIcon icon={faArrowsRotate} />
          {updating ? 'Replacing...' : 'Replace'}
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
