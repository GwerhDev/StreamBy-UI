import s from './StorageDrive.module.css';
import { StorageList } from './StorageList';

export const StorageDrive = () => {
  return (
    <div className={s.sections}>
      <StorageList category="images" previewLimit={4} />
      <StorageList category="videos" previewLimit={4} />
      <StorageList category="audios" previewLimit={4} />
      <StorageList category="3d-models" previewLimit={4} />
    </div>
  );
};
