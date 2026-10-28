import { API_BASE } from '../config/api';
import { DbConnection, IntegrationConnection, IntegrationKind, IntegrationPoolEntry, StorageConnection } from '../interfaces';

const BASE = `${API_BASE}/streamby/user/integrations`;

export interface UserIntegrationPayload {
  kind: IntegrationKind;
  provider: string;
  name: string;
  description?: string;
  credential: unknown;
}

export async function getUserIntegrations(): Promise<IntegrationPoolEntry[]> {
  const res = await fetch(BASE, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function createUserIntegration(payload: UserIntegrationPayload): Promise<IntegrationPoolEntry> {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function updateUserIntegration(
  id: string,
  updates: Partial<Pick<UserIntegrationPayload, 'name' | 'description' | 'credential'>>,
): Promise<IntegrationPoolEntry> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

/** The projects it was disconnected from, each with its connections as they are now. */
export async function deleteUserIntegration(id: string): Promise<{ affected: { projectId: string; dbConnections: DbConnection[]; storageConnections: StorageConnection[]; integrationConnections: IntegrationConnection[] }[] }> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message);
  const body = await res.json();
  return { affected: body.affected ?? [] };
}

export interface IntegrationDependent {
  projectId: string;
  projectName: string;
  kind: 'db' | 'storage' | 'service';
  connectionId: string;
  name: string;
}

/** The projects' connections that use it: deleting it disconnects them. */
export async function getUserIntegrationDependents(id: string): Promise<IntegrationDependent[]> {
  const res = await fetch(`${API_BASE}/streamby/user/integrations/${encodeURIComponent(id)}/dependents`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
  return (await res.json()).dependents;
}
