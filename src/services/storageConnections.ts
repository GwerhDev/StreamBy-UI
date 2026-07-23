import { API_BASE } from '../config/api';
import { StorageConnection, StorageConnectionType } from '../interfaces';

const BASE = (projectId: string) => `${API_BASE}/streamby/projects/${projectId}/connections/storage`;

export interface StorageConnectionPayload {
  name: string;
  type: StorageConnectionType;
  credentialId?: string;
  integrationId?: string;
  description?: string;
}

export async function fetchStorageConnections(projectId: string): Promise<StorageConnection[]> {
  const res = await fetch(BASE(projectId), { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function createStorageConnection(projectId: string, payload: StorageConnectionPayload): Promise<StorageConnection> {
  const res = await fetch(BASE(projectId), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function deleteStorageConnection(projectId: string, connId: string): Promise<void> {
  const res = await fetch(`${BASE(projectId)}/${connId}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message);
}
