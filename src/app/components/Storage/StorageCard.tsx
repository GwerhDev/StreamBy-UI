import s from './StorageCard.module.css';
import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeadphones, faVideo, faCubes, faTrash, faDownload,
  faXmark, faCopy, faCheck, faEye,
} from '@fortawesome/free-solid-svg-icons';
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

const CTX_W = 188;
const CTX_H = 172; // approximate menu height

export function StorageCard({ file, category, onDelete }: StorageCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [ctxConfirmDelete, setCtxConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);

  // Close preview on Escape
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePreview(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewOpen]);

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeCtx();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCtx(); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  const closePreview = () => {
    setPreviewOpen(false);
    setConfirmDelete(false);
  };

  const closeCtx = () => {
    setContextMenu(null);
    setCtxConfirmDelete(false);
    setSelected(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = e.clientX + CTX_W > window.innerWidth  ? e.clientX - CTX_W : e.clientX;
    const y = e.clientY + CTX_H > window.innerHeight ? e.clientY - CTX_H : e.clientY;
    setContextMenu({ x, y });
    setCtxConfirmDelete(false);
    setSelected(true);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(file.key);
      closePreview();
    } else {
      setConfirmDelete(true);
    }
  };

  const handleCtxDelete = () => {
    if (ctxConfirmDelete) {
      onDelete(file.key);
      closeCtx();
    } else {
      setCtxConfirmDelete(true);
    }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCtxCopy = async () => {
    await navigator.clipboard.writeText(file.url);
    closeCtx();
  };

  return (
    <>
      <div
        className={`${s.card} ${selected ? s.cardSelected : ''}`}
        tabIndex={0}
        onClick={() => setSelected(true)}
        onBlur={() => setSelected(false)}
        onDoubleClick={() => setPreviewOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter') setPreviewOpen(true); }}
        onContextMenu={handleContextMenu}
      >
        <div className={s.preview}>
          {category === 'images' ? (
            <img src={file.url} alt={file.name} className={s.image} loading="lazy" />
          ) : (
            <div className={s.iconPreview}>
              <FontAwesomeIcon
                icon={categoryIcon[category as keyof typeof categoryIcon] ?? faCubes}
                className={s.fileIcon}
              />
            </div>
          )}
        </div>
        <div className={s.info}>
          <p className={s.name} title={file.name}>{file.name}</p>
          <span className={s.size}>{formatBytes(file.size)}</span>
        </div>
      </div>

      {/* ── Context menu ── */}
      {contextMenu && (
        <ul
          ref={menuRef}
          className={s.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <li
            className={s.ctxItem}
            onClick={() => { setPreviewOpen(true); closeCtx(); }}
          >
            <FontAwesomeIcon icon={faEye} className={s.ctxIcon} />
            Preview
          </li>
          <li className={s.ctxItem} onClick={handleCtxCopy}>
            <FontAwesomeIcon icon={faCopy} className={s.ctxIcon} />
            Copy URL
          </li>
          <li className={s.ctxItem} onClick={closeCtx}>
            <a target='_blank' href={file.url} download={file.name} className={s.ctxLink}>
              <FontAwesomeIcon icon={faDownload} className={s.ctxIcon} />
              Download
            </a>
          </li>
          <li className={s.ctxDivider} />
          <li
            className={`${s.ctxItem} ${ctxConfirmDelete ? s.ctxItemConfirm : s.ctxItemDanger}`}
            onClick={handleCtxDelete}
          >
            <FontAwesomeIcon icon={faTrash} className={s.ctxIcon} />
            {ctxConfirmDelete ? 'Confirm delete' : 'Delete'}
          </li>
        </ul>
      )}

      {/* ── Preview modal ── */}
      {previewOpen && (
        <div className={s.previewBackdrop} onClick={closePreview}>
          <div className={s.previewModal} onClick={(e) => e.stopPropagation()}>
            <button className={s.previewClose} onClick={closePreview} title="Close">
              <FontAwesomeIcon icon={faXmark} />
            </button>

            {category === 'images' && (
              <img src={file.url} alt={file.name} className={s.previewImage} />
            )}
            {category === 'videos' && (
              <video src={file.url} className={s.previewVideo} controls autoPlay />
            )}
            {category === 'audios' && (
              <audio src={file.url} className={s.previewAudio} controls autoPlay />
            )}
            {category === '3d-models' && (
              <div className={s.previewModelPlaceholder}>
                <FontAwesomeIcon icon={faCubes} className={s.previewModelIcon} />
              </div>
            )}

            <p className={s.previewName}>{file.name}</p>

            <div className={s.previewActions}>
              <button className={s.previewActionBtn} onClick={handleCopyUrl} title="Copy public S3 URL">
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
              <a href={file.url} download={file.name} className={s.previewActionBtn} title="Download file">
                <FontAwesomeIcon icon={faDownload} />
                Download
              </a>
              <button
                className={`${s.previewActionBtn} ${confirmDelete ? s.previewConfirmDeleteBtn : s.previewDeleteBtn}`}
                onClick={handleDelete}
                title={confirmDelete ? 'Click again to confirm deletion' : 'Delete file'}
              >
                <FontAwesomeIcon icon={faTrash} />
                {confirmDelete ? 'Confirm delete' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
