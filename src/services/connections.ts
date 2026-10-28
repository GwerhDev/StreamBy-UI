import { API_BASE } from "../config/api";
import { Connection, ConnectionPayload } from '../interfaces';

export async function getConnections(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections`, {
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

/** The connection made, and the project's API connections as they are now. */
export async function createConnection(projectId: string, payload: ConnectionPayload): Promise<{ data: Connection; connections: Connection[] }> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { error, details } = await res.json();
    throw new Error(`Failed to create connection: ${error} - ${details}`);
  }
  return res.json();
}

export async function getConnection(projectId: string, connectionId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections/${connectionId}`, {
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

export async function updateConnection(projectId: string, connectionId: string, payload: Partial<ConnectionPayload>) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections/${connectionId}`, {
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

export async function deleteConnection(projectId: string, connectionId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/connections/${connectionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete connection');
  }
  return res.json();
}
