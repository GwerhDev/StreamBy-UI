import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { StorageConnection } from '../../../interfaces';
import { getStorageFolders } from '../../../services/storage';

export interface FolderPath {
  id: string;
  // Where it is, from the top of its storage: "Renders / Mixes".
  path: string;
}

const NO_CONNECTIONS: StorageConnection[] = [];
// A tree deeper than this is cut there.
const DEPTH = 6;

// Every Storage folder of the project's storages, by where it is (only once `enabled`).
export function useStorageFolderPaths(projectId: string, enabled: boolean): FolderPath[] | null {
  const connections = useSelector((state: RootState) => state.currentProject?.data?.storageConnections ?? NO_CONNECTIONS) as StorageConnection[];
  const [paths, setPaths] = useState<FolderPath[] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const walk = async (connId: string, parentId: string | null, prefix: string, depth: number): Promise<FolderPath[]> => {
      if (depth > DEPTH) return [];
      const folders = await getStorageFolders(projectId, connId, parentId).catch(() => []);
      const nested = await Promise.all(folders.map(async f => {
        const path = prefix ? `${prefix} / ${f.name}` : f.name;
        return [{ id: f.id, path }, ...(await walk(connId, f.id, path, depth + 1))];
      }));
      return nested.flat();
    };
    const ids = connections.length ? connections.map(c => c.id) : ['builtin'];
    Promise.all(ids.map(id => walk(id, null, '', 1)))
      .then(all => { if (!cancelled) setPaths(all.flat().sort((a, b) => a.path.localeCompare(b.path))); });
    return () => { cancelled = true; };
  }, [projectId, enabled, connections]);

  return paths;
}
