import { useParams } from 'react-router-dom';
import { faImage, faHeadphones, faVideo, faCubes } from '@fortawesome/free-solid-svg-icons';
import { DirectoryList } from '../Dashboard/DirectoryList';

export const StorageDrive = () => {
  const { storageName } = useParams<{ storageName: string }>();

  const categories = [
    { name: 'Images',    icon: faImage,      path: `storage/${storageName}/images` },
    { name: 'Audios',    icon: faHeadphones,  path: `storage/${storageName}/audios` },
    { name: 'Videos',    icon: faVideo,       path: `storage/${storageName}/videos` },
    { name: '3D Models', icon: faCubes,       path: `storage/${storageName}/3d-models` },
  ];

  return <DirectoryList list={categories} />;
};
