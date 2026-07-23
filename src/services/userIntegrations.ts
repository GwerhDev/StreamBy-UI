import { API_BASE } from '../config/api';
import { IntegrationKind, IntegrationPoolEntry } from '../interfaces';

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

export async function deleteUserIntegration(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message);
}
