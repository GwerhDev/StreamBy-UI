import { API_BASE } from '../config/api';
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';
import { StorageConnection, StorageConnectionType } from '../interfaces';

const BASE = (projectId: string) => `${API_BASE}/streamby/projects/${projectId}/connections/storage`;

export interface StorageConnectionPayload {
  name: string;
  type: StorageConnectionType;
  credentialId: string;
  description?: string;
}

export async function fetchStorageConnections(projectId: string): Promise<StorageConnection[]> {
  try {
    const res = await fetch(BASE(projectId), { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).message);
    const { data } = await res.json();
    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch storage connections.', type: 'error' }));
    return [];
  }
}

export async function createStorageConnection(projectId: string, payload: StorageConnectionPayload): Promise<StorageConnection | null> {
  try {
    const res = await fetch(BASE(projectId), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    const { data } = await res.json();
    store.dispatch(addApiResponse({ message: 'Storage connection created successfully.', type: 'success' }));
    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to create storage connection.', type: 'error' }));
    return null;
  }
}

export async function deleteStorageConnection(projectId: string, connId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(projectId)}/${connId}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).message);
    store.dispatch(addApiResponse({ message: 'Storage connection deleted.', type: 'success' }));
    return true;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to delete storage connection.', type: 'error' }));
    return false;
  }
}
