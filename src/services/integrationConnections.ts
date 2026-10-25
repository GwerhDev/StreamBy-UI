import { API_BASE } from '../config/api';
import { addProjectIntegration, removeProjectIntegration } from './projects';
import { IntegrationConnection } from '../interfaces';

// No dedicated POST /connections/integration route exists on the backend — IntegrationConnection
// rows are created via the existing generic project-integration attach endpoint, classified
// server-side by classifyIntegrationId based on the integration's kind.
export async function createIntegrationConnection(projectId: string, integrationId: string): Promise<IntegrationConnection> {
  const { data } = await addProjectIntegration(projectId, integrationId);
  return data as IntegrationConnection;
}

export async function deleteIntegrationConnection(projectId: string, integrationId: string): Promise<void> {
  await removeProjectIntegration(projectId, integrationId);
}

export async function fetchIntegrationConnections(projectId: string): Promise<IntegrationConnection[]> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/integrations`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  const { data } = await res.json();
  return data;
}
