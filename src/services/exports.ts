import { API_BASE } from "../config/api";
import { ExportPayload } from "../interfaces";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';

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
  } catch (error: any) {
    console.error('Error fetching exports list:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch export.', type: 'error' }));
    return [];
  }
}

export async function createExport(projectId: string, payload: Record<string, any>) {
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
    store.dispatch(addApiResponse({ message: 'Export created successfully.', type: 'success' }));
    return data;
  } catch (error: any) {
    console.error('Error creating export:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to create export.', type: 'error' }));
  }
}

export async function createRawExport(projectId: string, payload: Record<string, any>) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/raw`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`Failed to create raw export: ${error} - ${details}`);
    }
    const { data } = await res.json() || {};
    store.dispatch(addApiResponse({ message: 'Raw export created successfully.', type: 'success' }));
    return data;
  } catch (error: any) {
    console.error('Error creating raw export:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to create raw export.', type: 'error' }));
  }
}

export async function updateRawExport(projectId: string, exportId: string, payload: Record<string, any>) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/raw/${exportId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`Failed to update raw export: ${error} - ${details}`);
    }
    const { data } = await res.json() || {};
    store.dispatch(addApiResponse({ message: 'Raw export updated successfully.', type: 'success' }));
    return data;
  } catch (error: any) {
    console.error('Error updating raw export:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to update raw export.', type: 'error' }));
  }
}

export async function updateExport(projectId: string, exportId: string | undefined, payload: ExportPayload): Promise<any> {
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
    store.dispatch(addApiResponse({ message: 'Export updated successfully.', type: 'success' }));
    return data;
  } catch (error: any) {
    console.error('Error updating export:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to update export.', type: 'error' }));
  }
}

export async function deleteExport(projectId: string | undefined, exportId: string | undefined) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/exports/${exportId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to delete project.', type: 'error' }));
    throw error;
  }
}