import s from './StorageFileCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faHeadphones, faVideo, faCubes } from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';

const categoryMeta: Record<StorageCategory, { icon: typeof faImage; label: string }> = {
  images:     { icon: faImage,      label: 'Image' },
  audios:     { icon: faHeadphones, label: 'Audio' },
  videos:     { icon: faVideo,      label: 'Video' },
  '3d-models': { icon: faCubes,     label: '3D' },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface StorageFileCardProps {
  file: StorageFile;
}

export function StorageFileCard({ file }: StorageFileCardProps) {
  const { icon, label } = categoryMeta[file.category];

  return (
    <div className={s.card}>
      <div className={s.left}>
        <div className={s.iconWrap}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <div>
          <p className={s.name} title={file.name}>{file.name}</p>
          <p className={s.meta}>{formatBytes(file.size)} · {timeAgo(file.lastModified)}</p>
        </div>
      </div>
      <div className={s.right}>
        <span className={s.categoryBadge}>{label}</span>
      </div>
    </div>
  );
}
