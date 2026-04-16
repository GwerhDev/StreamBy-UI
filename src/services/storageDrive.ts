import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';
import { StorageFile } from '../interfaces';

export async function getRecentFiles(projectId: string): Promise<StorageFile[]> {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/storage/lasts`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch recent files');
    }

    const { data } = await res.json();
    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch recent files.', type: 'error' }));
    return [];
  }
}
