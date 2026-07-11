import { API_BASE } from "../config/api";
import { Workflow, WorkflowPayload } from "../interfaces";

export async function getProjectWorkflow(projectId: string): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/workflow`, {
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

export async function updateProjectWorkflow(projectId: string, payload: Partial<WorkflowPayload>): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/workflow`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  const { data } = await res.json();
  return data;
}

