import { API_BASE } from "../config/api";
import { WorkflowPayload } from "../interfaces";

export async function getWorkflows(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/workflows`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const { data } = await res.json();
  return data;
}

export async function getWorkflow(projectId: string, workflowId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/workflows/${workflowId}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const { data } = await res.json();
  return data;
}

export async function createWorkflow(projectId: string, payload: WorkflowPayload) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/workflows`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const { data } = await res.json();
  return data;
}

export async function updateWorkflow(projectId: string, workflowId: string, payload: Partial<WorkflowPayload>) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/workflows/${workflowId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const { data } = await res.json();
  return data;
}

export async function deleteWorkflow(projectId: string, workflowId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/workflows/${workflowId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}
