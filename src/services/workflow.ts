import { API_BASE } from "../config/api";
import { Project, Workflow, WorkflowPayload } from "../interfaces";

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


// The project's resource lists as the server has them after the workflow is saved.
export type ProjectLists = Pick<Project, 'dbConnections' | 'storageConnections' | 'integrationConnections' | 'connections' | 'exports' | 'pipelines'>;

/** Saved over a newer version (someone changed it since it was opened): the workflow as it is now. */
export class WorkflowConflict extends Error {
  constructor(message: string, public workflow: Workflow) {
    super(message);
    this.name = 'WorkflowConflict';
  }
}

/**
 * Saves the workflow, made on the version it was opened at: the server makes the project what it
 * defines (connects what its nodes were set to, removes what their nodes are gone of) and answers
 * the workflow, the project's lists as they are then, and what couldn't be done.
 */
export async function saveWorkflow(projectId: string, nodeSchema: Workflow['nodeSchema'], baseUpdatedAt?: string): Promise<{ data: Workflow; project: ProjectLists; errors: string[] }> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/workflow`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeSchema, ...(baseUpdatedAt && { baseUpdatedAt }) }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 409) throw new WorkflowConflict(body.message || 'The workflow changed since it was opened.', body.data);
  if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`);
  return { data: body.data, project: body.project ?? {}, errors: body.errors ?? [] };
}
