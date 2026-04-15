import { useParams, Navigate } from 'react-router-dom';
import { StorageCategory as StorageCategoryType } from '../../../interfaces';
import { StorageList } from './StorageList';

const validTypes: StorageCategoryType[] = ['images', 'audios', 'videos', '3d-models'];

export const StorageCategory = () => {
  const { contentType } = useParams<{ contentType: string }>();

  if (!contentType || !validTypes.includes(contentType as StorageCategoryType)) {
    return <Navigate to="not-found" replace />;
  }

  return <StorageList category={contentType as StorageCategoryType} />;
};
