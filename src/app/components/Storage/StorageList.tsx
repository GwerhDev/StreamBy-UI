import s from './StorageList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCloudArrowUp, faImage, faHeadphones, faVideo, faCubes } from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';
import { getStorageFiles, deleteStorageFile } from '../../../services/storage';
import { StorageCard } from './StorageCard';
import { UploadModal } from '../Modals/UploadModal';

interface StorageListProps {
  category: StorageCategory;
  previewLimit?: number;
}

const categoryMeta: Record<StorageCategory, { label: string; icon: typeof faImage }> = {
  images: { label: 'Images', icon: faImage },
  audios: { label: 'Audios', icon: faHeadphones },
  videos: { label: 'Videos', icon: faVideo },
  '3dmodels': { label: '3D Models', icon: faCubes },
};

export function StorageList({ category, previewLimit }: StorageListProps) {
  const { id: projectId, storageName } = useParams<{ id: string; storageName: string }>();
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

  const displayedFiles = previewLimit ? files.slice(0, previewLimit) : files;
  const viewAllPath = `/project/${projectId}/storage/${storageName}/${category}`;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.titleRow}>
          <FontAwesomeIcon icon={meta.icon} className={s.categoryIcon} />
          <h2>{meta.label}</h2>
        </div>
        {!previewLimit && (
          <button className={s.uploadBtn} onClick={() => setUploadModalOpen(true)}>
            <FontAwesomeIcon icon={faCloudArrowUp} />
            Upload
          </button>
        )}
        {previewLimit && storageName && (
          <Link to={viewAllPath} className={s.viewAllLink}>
            View all
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        )}
      </div>

      {loading ? (
        <ul className={s.grid}>
          {Array.from({ length: previewLimit ?? 6 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : files.length === 0 ? (
        <div className={s.empty}>
          <FontAwesomeIcon icon={meta.icon} className={s.emptyIcon} />
          <p>No {meta.label.toLowerCase()} yet</p>
          {!previewLimit && (
            <button className={s.uploadBtn} onClick={() => setUploadModalOpen(true)}>
              <FontAwesomeIcon icon={faCloudArrowUp} />
              Upload your first file
            </button>
          )}
        </div>
      ) : (
        <ul className={s.grid}>
          {displayedFiles.map(file => (
            <li key={file.key}>
              <StorageCard file={file} category={category} onDelete={handleDelete} />
            </li>
          ))}
          {previewLimit && files.length > previewLimit && storageName ? (
            <li>
              <Link to={viewAllPath} className={s.viewAllCard}>
                <FontAwesomeIcon icon={faArrowRight} className={s.uploadCardIcon} />
                <span>View all {meta.label}</span>
              </Link>
            </li>
          ) : !previewLimit ? (
            <li className={s.uploadCard} onClick={() => setUploadModalOpen(true)}>
              <FontAwesomeIcon icon={faCloudArrowUp} className={s.uploadCardIcon} />
              <span>Upload file</span>
            </li>
          ) : null}
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
