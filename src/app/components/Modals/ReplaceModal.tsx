import s from './ReplaceModal.module.css';
import { useState, useRef, DragEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate, faXmark, faFile, faCloudArrowUp,
  faHeadphones, faVideo, faCubes,
} from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';
import { Spinner } from '../Spinner';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { ModalShell } from './ModalShell';

interface ReplaceModalProps {
  file: StorageFile;
  category: StorageCategory;
  onConfirm: (file: File) => Promise<void>;
  onClose: () => void;
}

const EXTENSION_MIME: Record<string, string> = {
  glb:  'model/gltf-binary',
  gltf: 'model/gltf+json',
  obj:  'model/obj',
  fbx:  'application/octet-stream',
  stl:  'model/stl',
  ply:  'model/ply',
};

function resolveContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MIME[ext] ?? 'application/octet-stream';
}

const acceptTypes: Record<StorageCategory, string> = {
  images: 'image/*',
  audios: 'audio/*',
  videos: 'video/*',
  '3d-models': '.glb,.gltf,.obj,.fbx,.stl,.ply',
};

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

export function ReplaceModal({ file, category, onConfirm, onClose }: ReplaceModalProps) {
  const [picked, setPicked] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setPicked(f);
  };

  const handleConfirm = async () => {
    if (!picked) return;
    setUploading(true);
    try {
      await onConfirm(picked);
      onClose();
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalShell
      title={`Replace "${file.displayName}"`}
      icon={faArrowsRotate}
      onClose={onClose}
      footer={
        <>
          <SecondaryButton text="Cancel" icon={faXmark} onClick={onClose} disabled={uploading} />
          <ActionButton
            text={uploading ? 'Replacing...' : 'Replace'}
            icon={faArrowsRotate}
            onClick={handleConfirm}
            disabled={!picked || uploading}
            isLoading={uploading}
          />
        </>
      }
    >
      <Spinner bg isLoading={uploading} />

      <div className={s.currentPreview}>
        <p className={s.sectionLabel}>Current file</p>
        <div className={s.previewBox}>
          {category === 'images' ? (
            <img src={file.url} alt={file.displayName} className={s.previewImage} />
          ) : (
            <div className={s.previewIcon}>
              <FontAwesomeIcon icon={categoryIcon[category as keyof typeof categoryIcon] ?? faCubes} />
            </div>
          )}
          <div className={s.previewMeta}>
            <span className={s.previewName}>{file.displayName}</span>
            <span className={s.previewSize}>{formatBytes(file.size)}</span>
          </div>
        </div>
      </div>

      <div className={s.arrow}>
        <FontAwesomeIcon icon={faArrowsRotate} />
      </div>

      <div className={s.newSection}>
        <p className={s.sectionLabel}>New file</p>
        {picked ? (
          <div className={s.pickedFile}>
            <FontAwesomeIcon icon={faFile} className={s.pickedIcon} />
            <span className={s.pickedName}>{picked.name}</span>
            <span className={s.pickedSize}>{formatBytes(picked.size)}</span>
            <button className={s.clearBtn} onClick={() => setPicked(null)} disabled={uploading}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ) : (
          <div
            className={`${s.dropZone} ${dragging ? s.dropZoneActive : ''}`}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
          >
            <FontAwesomeIcon icon={faCloudArrowUp} className={s.dropIcon} />
            <p className={s.dropText}>
              Drag & drop or <span className={s.browseLink}>browse</span>
            </p>
            <p className={s.dropHint}>Accepted: {acceptTypes[category]}</p>
            <input
              ref={inputRef}
              type="file"
              accept={acceptTypes[category]}
              className={s.hiddenInput}
              onChange={e => { const f = e.target.files?.[0]; if (f) setPicked(f); }}
            />
          </div>
        )}
      </div>
    </ModalShell>
  );
}
