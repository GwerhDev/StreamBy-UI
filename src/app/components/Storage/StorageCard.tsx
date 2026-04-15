import s from './StorageCard.module.css';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadphones, faVideo, faCubes, faTrash, faDownload } from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';

interface StorageCardProps {
  file: StorageFile;
  category: StorageCategory;
  onDelete: (key: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const categoryIcon = {
  audios: faHeadphones,
  videos: faVideo,
  '3d-models': faCubes,
};

export function StorageCard({ file, category, onDelete }: StorageCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(file.key);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleMouseLeave = () => {
    setConfirmDelete(false);
  };

  return (
    <div className={s.card} onMouseLeave={handleMouseLeave}>
      <div className={s.preview}>
        {category === 'images' ? (
          <img src={file.url} alt={file.name} className={s.image} loading="lazy" />
        ) : (
          <div className={s.iconPreview}>
            <FontAwesomeIcon icon={categoryIcon[category as keyof typeof categoryIcon] ?? faCubes} className={s.fileIcon} />
          </div>
        )}
        <div className={s.overlay}>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className={s.overlayBtn}
            onClick={(e) => e.stopPropagation()}
            title="Download / Open"
          >
            <FontAwesomeIcon icon={faDownload} />
          </a>
          <button
            className={`${s.overlayBtn} ${confirmDelete ? s.confirmBtn : s.deleteBtn}`}
            onClick={handleDeleteClick}
            title={confirmDelete ? 'Click again to confirm' : 'Delete file'}
          >
            <FontAwesomeIcon icon={faTrash} />
            {confirmDelete && <span className={s.confirmLabel}>Confirm</span>}
          </button>
        </div>
      </div>
      <div className={s.info}>
        <p className={s.name} title={file.name}>{file.name}</p>
        <span className={s.size}>{formatBytes(file.size)}</span>
      </div>
    </div>
  );
}
