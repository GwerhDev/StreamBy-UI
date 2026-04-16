import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';
import { StorageCategory, StorageFile } from '../interfaces';

const CATEGORIES: StorageCategory[] = ['images', 'audios', 'videos', '3d-models'];

async function fetchCategory(projectId: string, category: StorageCategory): Promise<StorageFile[]> {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/storage/${category}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return [];
    const { data } = await res.json();
    return (data as StorageFile[]).map(f => ({ ...f, category }));
  } catch {
    return [];
  }
}

export async function getRecentFiles(projectId: string, limit = 10): Promise<StorageFile[]> {
  try {
    const results = await Promise.all(CATEGORIES.map(cat => fetchCategory(projectId, cat)));
    const all = results.flat();
    all.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    return all.slice(0, limit);
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: 'Failed to load recent files.', type: 'error' }));
    return [];
  }
}
