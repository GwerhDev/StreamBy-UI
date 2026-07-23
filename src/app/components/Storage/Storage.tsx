import { useSelector } from 'react-redux';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { DirectoryList } from '../Dashboard/DirectoryList';

export const Storage = () => {
  const integrations = useSelector((state: RootState) => state.management.integrations);
  const storages = integrations.filter(i => i.kind === 'storage' && i.available);

  const list = storages.map(entry => ({
    name: entry.name,
    icon: faCloud,
    path: `storage/${entry.id}`,
  }));

  return <DirectoryList list={list} />;
};
