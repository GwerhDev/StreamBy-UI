import { API_BASE } from "../config/api";

export async function getExport(projectId: string, exportId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/${exportId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`Failed to fetch exports list: ${error} - ${details}`);
    }

    const { data } = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching exports list:', error);
    return [];
  }
}

export async function createExport(projectId: string, payload: Record<string, any> | Record<string, any>[]) {
  try {

    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`Failed to create export: ${error} - ${details}`);
    }
    const { data } = await res.json() || {};

    return data;
  } catch (error) {
    console.error('Error creating export:', error);
  }
}

export async function updateExport(projectId: string, exportId: string, payload: { name: string; description?: string; collectionName: string; data?: Record<string, any> | Record<string, any>[] }) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/${exportId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`Failed to update export: ${error} - ${details}`);
    }
    const { data } = await res.json() || {};

    return data;
  } catch (error) {
    console.error('Error updating export:', error);
  }
}