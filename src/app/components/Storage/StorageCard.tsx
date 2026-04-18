import s from './StorageCard.module.css';
import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeadphones, faVideo, faCubes, faTrash, faDownload,
  faXmark, faCopy, faCheck, faEye, faPencil,
} from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';

interface StorageCardProps {
  file: StorageFile;
  category: StorageCategory;
  onDelete: (id: string) => void;
  onRename?: (id: string, displayName: string) => Promise<void>;
  selected?: boolean;
  onSelect?: (file: StorageFile) => void;
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
const CTX_H = 200;

export function StorageCard({ file, category, onDelete, onRename, selected: controlledSelected, onSelect }: StorageCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState(false);
  const isControlled = onSelect !== undefined;
  const selected = isControlled ? (controlledSelected ?? false) : internalSelected;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [ctxConfirmDelete, setCtxConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePreview(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewOpen]);

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

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const closePreview = () => {
    setPreviewOpen(false);
    setConfirmDelete(false);
    setRenaming(false);
  };

  const closeCtx = () => {
    setContextMenu(null);
    setCtxConfirmDelete(false);
    if (!isControlled) setInternalSelected(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = e.clientX + CTX_W > window.innerWidth  ? e.clientX - CTX_W : e.clientX;
    const y = e.clientY + CTX_H > window.innerHeight ? e.clientY - CTX_H : e.clientY;
    setContextMenu({ x, y });
    setCtxConfirmDelete(false);
    if (isControlled) onSelect!(file);
    else setInternalSelected(true);
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

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setRenaming(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(file.id);
      closePreview();
    } else {
      setConfirmDelete(true);
    }
  };

  const handleCtxDelete = () => {
    if (ctxConfirmDelete) {
      onDelete(file.id);
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
        onClick={() => isControlled ? onSelect!(file) : setInternalSelected(true)}
        onBlur={() => { if (!isControlled) setInternalSelected(false); }}
        onDoubleClick={() => setPreviewOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter') setPreviewOpen(true); }}
        onContextMenu={handleContextMenu}
      >
        <div className={s.preview}>
          {category === 'images' ? (
            <img src={file.url} alt={file.displayName} className={s.image} loading="lazy" />
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
          {renaming ? (
            <input
              ref={renameInputRef}
              className={s.renameInput}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={commitRename}
              disabled={renameLoading}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <p className={s.name} title={file.displayName}>{file.displayName}</p>
          )}
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
            <a target='_blank' href={file.url} download={file.displayName} className={s.ctxLink}>
              <FontAwesomeIcon icon={faDownload} className={s.ctxIcon} />
              Download
            </a>
          </li>
          {onRename && (
            <li
              className={s.ctxItem}
              onClick={() => { startRename(); closeCtx(); }}
            >
              <FontAwesomeIcon icon={faPencil} className={s.ctxIcon} />
              Rename
            </li>
          )}
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
              <img src={file.url} alt={file.displayName} className={s.previewImage} />
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

            {renaming ? (
              <input
                className={s.previewRenameInput}
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={commitRename}
                disabled={renameLoading}
                autoFocus
              />
            ) : (
              <p className={s.previewName}>{file.displayName}</p>
            )}

            <div className={s.previewActions}>
              <button className={s.previewActionBtn} onClick={handleCopyUrl} title="Copy public S3 URL">
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
              <a href={file.url} download={file.displayName} className={s.previewActionBtn} title="Download file">
                <FontAwesomeIcon icon={faDownload} />
                Download
              </a>
              {onRename && (
                <button
                  className={s.previewActionBtn}
                  onClick={startRename}
                  disabled={renameLoading}
                  title="Rename file"
                >
                  <FontAwesomeIcon icon={faPencil} />
                  {renameLoading ? 'Renaming...' : 'Rename'}
                </button>
              )}
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
