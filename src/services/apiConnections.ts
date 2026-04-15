import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';
import { ApiConnectionPayload } from '../interfaces';

export async function getApiConnections(projectId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/api/connections`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`Failed to fetch connections: ${error} - ${details}`);
    }

    const { data } = await res.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch connections.', type: 'error' }));
    return [];
  }
}

export async function createApiConnection(projectId: string, payload: ApiConnectionPayload) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/api/connections`, {
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
    store.dispatch(addApiResponse({ message: 'API connection created successfully.', type: 'success' }));
    return data;
  } catch (error: any) {
    console.error('Error creating connection:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to create connection.', type: 'error' }));
  }
}

export async function deleteApiConnection(projectId: string, connectionId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/api/connections/${connectionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to delete connection.', type: 'error' }));
    throw error;
  }
}
