import s from './UploadModal.module.css';
import { useState, useRef, DragEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faXmark, faFile } from '@fortawesome/free-solid-svg-icons';
import { StorageCategory } from '../../../interfaces';
import { getStorageUploadUrl, uploadToPresignedUrl } from '../../../services/storage';
import { Spinner } from '../Spinner';

interface UploadModalProps {
  projectId: string;
  category: StorageCategory;
  onSuccess: () => void;
  onClose: () => void;
}

const acceptTypes: Record<StorageCategory, string> = {
  images: 'image/*',
  audios: 'audio/*',
  videos: 'video/*',
  '3dmodels': '.glb,.gltf,.obj,.fbx,.stl,.ply',
};

const categoryLabels: Record<StorageCategory, string> = {
  images: 'images',
  audios: 'audio files',
  videos: 'videos',
  '3dmodels': '3D model files',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function UploadModal({ projectId, category, onSuccess, onClose }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...arr.filter(f => !existing.has(f.name + f.size))];
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      await Promise.all(files.map(async (file) => {
        const { url } = await getStorageUploadUrl(projectId, category, file.name, file.type);
        await uploadToPresignedUrl(url, file, file.type);
      }));
      onSuccess();
    } finally {
      setUploading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={s.backdrop} onClick={handleBackdropClick}>
      <div className={s.modal}>
        <Spinner bg isLoading={uploading} />
        <div className={s.modalHeader}>
          <h3>Upload {categoryLabels[category]}</h3>
          <button className={s.closeBtn} onClick={onClose} title="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div
          className={`${s.dropZone} ${dragging ? s.dropZoneActive : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          <FontAwesomeIcon icon={faCloudArrowUp} className={s.dropIcon} />
          <p className={s.dropText}>
            Drag & drop files here, or <span className={s.browseLink}>browse</span>
          </p>
          <p className={s.dropHint}>Accepted: {acceptTypes[category]}</p>
          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes[category]}
            multiple
            className={s.hiddenInput}
            onChange={e => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <ul className={s.fileList}>
            {files.map((file, i) => (
              <li key={i} className={s.fileItem}>
                <FontAwesomeIcon icon={faFile} className={s.fileItemIcon} />
                <span className={s.fileName}>{file.name}</span>
                <span className={s.fileSize}>{formatBytes(file.size)}</span>
                <button className={s.removeFileBtn} onClick={() => removeFile(i)} title="Remove">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={s.actions}>
          <button className={s.cancelBtn} onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            className={s.uploadBtn}
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            <FontAwesomeIcon icon={faCloudArrowUp} />
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
