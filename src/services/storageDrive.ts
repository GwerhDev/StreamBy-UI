import { API_BASE } from "../config/api";
import { StorageFile } from '../interfaces';

export async function getRecentFiles(projectId: string, connId: string): Promise<StorageFile[]> {
  const res = await fetch(
    `${API_BASE}/streamby/projects/${projectId}/connections/storage/${connId}/files/lasts`,
    { method: 'GET', credentials: 'include' },
  );
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch recent files');
  }
  const { data } = await res.json();
  return data;
}
