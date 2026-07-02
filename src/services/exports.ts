import { API_BASE } from "../config/api";

export async function getExport(projectId: string, exportId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/${exportId}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const { error, details } = await res.json();
    throw new Error(`Failed to fetch export: ${error} - ${details}`);
  }
  const { data } = await res.json();
  return data;
}

export async function createExport(projectId: string | undefined, payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { error, details } = await res.json();
    throw new Error(`Failed to create export: ${error} - ${details}`);
  }
  const { data } = await res.json() || {};
  return data;
}

export async function updateExport(projectId: string, exportId: string, payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/${exportId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { error, details } = await res.json();
    throw new Error(`Failed to update export: ${error} - ${details}`);
  }
  const { data } = await res.json() || {};
  return data;
}

export async function previewExport(projectId: string, exportName: string) {
  const res = await fetch(`${API_BASE}/streamby/${projectId}/export/${exportName}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getProjectReviews(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/reviews`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  const { reviews } = await res.json();
  return reviews;
}

export async function deleteExport(projectId: string | undefined, exportId: string | undefined) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/${exportId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete export');
  }
  return res.json();
}
