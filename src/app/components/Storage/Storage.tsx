import { useSelector } from 'react-redux';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { DirectoryList } from '../Dashboard/DirectoryList';

export const Storage = () => {
  const storages = useSelector((state: RootState) => state.management.storages);

  const list = storages.map(s => ({
    name: s.name,
    icon: faCloud,
    path: `storage/${s.value}`,
  }));

  return <DirectoryList list={list} />;
};
