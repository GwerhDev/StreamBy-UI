import s from './StorageDrive.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faHeadphones, faVideo, faCubes, faClock, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { StorageFile } from '../../../interfaces';
import { RootState } from '../../../store';
import { StorageCard } from './StorageCard';
import { getRecentFiles } from '../../../services/storageDrive';
import { deleteStorageFile } from '../../../services/storage';

const CATEGORIES = [
  { key: 'images',    label: 'Images',    icon: faImage },
  { key: 'audios',    label: 'Audios',    icon: faHeadphones },
  { key: 'videos',    label: 'Videos',    icon: faVideo },
  { key: '3d-models', label: '3D Models', icon: faCubes },
] as const;

export const StorageDrive = () => {
  const { storageName } = useParams<{ storageName: string }>();
  const projectId = useSelector((state: RootState) => state.currentProject.data?.id);
  const navigate = useNavigate();

  const [recentFiles, setRecentFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const files = await getRecentFiles(projectId);
    setRecentFiles(files);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  const handleDelete = async (key: string) => {
    const file = recentFiles.find(f => f.key === key);
    if (!file || !projectId) return;
    await deleteStorageFile(projectId, file.category, key);
    setRecentFiles(prev => prev.filter(f => f.key !== key));
  };

  return (
    <div className={s.page}>

      {/* ── Categories ── */}
      <section className={s.section}>
        <div className={s.sectionHeader}>
          <FontAwesomeIcon icon={faFolderOpen} className={s.sectionIcon} />
          <h3 className={s.sectionTitle}>Categories</h3>
        </div>
        <ul className={s.categoryGrid}>
          {CATEGORIES.map(({ key, label, icon }) => (
            <li
              key={key}
              className={s.categoryCard}
              onClick={() => navigate(`/project/${projectId}/storage/${storageName}/${key}`)}
            >
              <FontAwesomeIcon icon={icon} className={s.categoryIcon} />
              <h4 className={s.categoryLabel}>{label}</h4>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Recent uploads ── */}
      <section className={s.section}>
        <div className={s.sectionHeader}>
          <FontAwesomeIcon icon={faClock} className={s.sectionIcon} />
          <h3 className={s.sectionTitle}>Recent uploads</h3>
        </div>

        {loading ? (
          <ul className={s.fileGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className={`${s.fileSkeleton} ${skeleton.skeleton}`} />
            ))}
          </ul>
        ) : recentFiles.length === 0 ? (
          <p className={s.empty}>No files uploaded yet.</p>
        ) : (
          <ul className={s.fileGrid}>
            {recentFiles.map(file => (
              <li key={file.key}>
                <StorageCard file={file} category={file.category} onDelete={handleDelete} />
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
};
