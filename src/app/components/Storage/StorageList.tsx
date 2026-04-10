import s from './StorageList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faImage, faHeadphones, faVideo, faCubes } from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';
import { getStorageFiles, deleteStorageFile } from '../../../services/storage';
import { StorageCard } from './StorageCard';
import { UploadModal } from '../Modals/UploadModal';

interface StorageListProps {
  category: StorageCategory;
}

const categoryMeta: Record<StorageCategory, { label: string; icon: typeof faImage }> = {
  images: { label: 'Images', icon: faImage },
  audios: { label: 'Audios', icon: faHeadphones },
  videos: { label: 'Videos', icon: faVideo },
  '3dmodels': { label: '3D Models', icon: faCubes },
};

export function StorageList({ category }: StorageListProps) {
  const { id: projectId } = useParams<{ id: string }>();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const meta = categoryMeta[category];

  const fetchFiles = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const data = await getStorageFiles(projectId, category);
    setFiles(data || []);
    setLoading(false);
  }, [projectId, category]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (key: string) => {
    if (!projectId) return;
    try {
      await deleteStorageFile(projectId, category, key);
      setFiles(prev => prev.filter(f => f.key !== key));
    } catch {
      // error dispatched by service
    }
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
    fetchFiles();
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.titleRow}>
          <FontAwesomeIcon icon={meta.icon} className={s.categoryIcon} />
          <h2>{meta.label}</h2>
        </div>
        <button className={s.uploadBtn} onClick={() => setUploadModalOpen(true)}>
          <FontAwesomeIcon icon={faCloudArrowUp} />
          Upload
        </button>
      </div>

      {loading ? (
        <ul className={s.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : files.length === 0 ? (
        <div className={s.empty}>
          <FontAwesomeIcon icon={meta.icon} className={s.emptyIcon} />
          <p>No {meta.label.toLowerCase()} yet</p>
          <button className={s.uploadBtn} onClick={() => setUploadModalOpen(true)}>
            <FontAwesomeIcon icon={faCloudArrowUp} />
            Upload your first file
          </button>
        </div>
      ) : (
        <ul className={s.grid}>
          {files.map(file => (
            <li key={file.key}>
              <StorageCard file={file} category={category} onDelete={handleDelete} />
            </li>
          ))}
          <li className={s.uploadCard} onClick={() => setUploadModalOpen(true)}>
            <FontAwesomeIcon icon={faCloudArrowUp} className={s.uploadCardIcon} />
            <span>Upload file</span>
          </li>
        </ul>
      )}

      {uploadModalOpen && projectId && (
        <UploadModal
          projectId={projectId}
          category={category}
          onSuccess={handleUploadSuccess}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </div>
  );
}
