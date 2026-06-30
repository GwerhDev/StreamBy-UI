import { API_BASE } from "../config/api";
import { ApiConnectionPayload } from '../interfaces';

export async function getApiConnections(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections/api`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const { error, details } = await res.json();
    throw new Error(`Failed to fetch connections: ${error} - ${details}`);
  }
  const { data } = await res.json();
  return data;
}

export async function createApiConnection(projectId: string, payload: ApiConnectionPayload) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections/api`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { error, details } = await res.json();
    throw new Error(`Failed to create connection: ${error} - ${details}`);
  }
  const { data } = await res.json();
  return data;
}

export async function getApiConnection(projectId: string, connectionId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections/api/${connectionId}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const { error, details } = await res.json();
    throw new Error(`Failed to fetch connection: ${error} - ${details}`);
  }
  const { data } = await res.json();
  return data;
}

export async function updateApiConnection(projectId: string, connectionId: string, payload: Partial<ApiConnectionPayload>) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections/api/${connectionId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { error, details } = await res.json();
    throw new Error(`Failed to update connection: ${error} - ${details}`);
  }
  const { data } = await res.json();
  return data;
}

export async function getConnectionResponse(projectId: string, connectionId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/get-connection/${connectionId}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function deleteApiConnection(projectId: string, connectionId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections/api/${connectionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete connection');
  }
  return res.json();
}
