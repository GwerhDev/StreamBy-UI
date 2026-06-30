import s from './StorageList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCloudArrowUp, faImage, faHeadphones, faVideo, faCubes } from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory } from '../../../interfaces';
import { getStorageFiles, deleteStorageFile, renameStorageFile, getStorageReplaceUrl, uploadToPresignedUrl } from '../../../services/storage';
import { StorageCard } from './StorageCard';
import { UploadModal } from '../Modals/UploadModal';
import { ActionButton } from '../Buttons/ActionButton';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';

interface StorageListProps {
  category: StorageCategory;
  previewLimit?: number;
}

const categoryMeta: Record<StorageCategory, { label: string; icon: typeof faImage }> = {
  images: { label: 'Images', icon: faImage },
  audios: { label: 'Audios', icon: faHeadphones },
  videos: { label: 'Videos', icon: faVideo },
  '3d-models': { label: '3D Models', icon: faCubes },
};

export function StorageList({ category, previewLimit }: StorageListProps) {
  const { id: projectId, connId } = useParams<{ id: string; connId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const meta = categoryMeta[category];

  const fetchFiles = useCallback(async () => {
    if (!projectId || !connId) return;
    setLoading(true);
    const data = await getStorageFiles(projectId, connId, category);
    setFiles(data || []);
    setLoading(false);
  }, [projectId, connId, category]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleDelete = async (id: string) => {
    if (!projectId || !connId) return;
    try {
      await deleteStorageFile(projectId, connId, id);
      setFiles(prev => prev.filter(f => f.id !== id));
      dispatch(addApiResponse({ message: 'File deleted.', type: 'success' }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete file.', type: 'error' }));
    }
  };

  const handleRename = async (id: string, displayName: string) => {
    if (!projectId || !connId) return;
    try {
      const file = await renameStorageFile(projectId, connId, id, displayName);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, displayName: file.displayName } : f));
      dispatch(addApiResponse({ message: 'File renamed.', type: 'success' }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to rename file.', type: 'error' }));
    }
  };

  const handleReplace = async (id: string, file: File) => {
    if (!projectId || !connId) return;
    try {
      const { url } = await getStorageReplaceUrl(projectId, connId, id, file.type, file.name);
      await uploadToPresignedUrl(url, file, file.type);
      await fetchFiles();
      dispatch(addApiResponse({ message: 'File replaced.', type: 'success' }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to replace file.', type: 'error' }));
    }
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
    fetchFiles();
  };

  const displayedFiles = previewLimit ? files.slice(0, previewLimit) : files;
  const viewAllPath = `/project/${projectId}/storage/${connId}/${category}`;

  return (
    <div className={s.mainPanel}>
      <div className={s.header}>
        <div className={s.titleRow}>
          <FontAwesomeIcon icon={meta.icon} className={s.categoryIcon} />
          <h2>{meta.label}</h2>
        </div>
        {!previewLimit && (
          <ActionButton icon={faCloudArrowUp} text="Upload" onClick={() => setUploadModalOpen(true)} />
        )}
        {previewLimit && connId && (
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
            <ActionButton icon={faCloudArrowUp} text="Upload your first file" onClick={() => setUploadModalOpen(true)} />
          )}
        </div>
      ) : (
        <ul className={s.grid}>
          {displayedFiles.map(file => (
            <li key={file.id}>
              <StorageCard
                file={file}
                category={category}
                onDelete={handleDelete}
                onRename={handleRename}
                onReplace={handleReplace}
              />
            </li>
          ))}
          {previewLimit && files.length > previewLimit && connId ? (
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

      {uploadModalOpen && projectId && connId && (
        <UploadModal
          projectId={projectId}
          connId={connId}
          category={category}
          onSuccess={handleUploadSuccess}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </div>
  );
}
