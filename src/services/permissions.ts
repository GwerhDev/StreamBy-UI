import { API_BASE } from '../config/api';
import { ProjectPermissionsConfig } from '../interfaces';

const base = (projectId: string) => `${API_BASE}/streamby/projects/${projectId}/permissions`;

export interface ProjectPermissionsAnswer {
  permissions: ProjectPermissionsConfig;
  // What can be set: the actions a role may be let do, and what a project may add for its apps.
  actions: string[];
  appPermissions: string[];
}

export async function getProjectPermissions(projectId: string): Promise<ProjectPermissionsAnswer> {
  const res = await fetch(base(projectId), { credentials: 'include' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Failed to load the permissions');
  return body;
}

/** The project's permissions changed (its admins only): what's given replaces what it had. */
export async function saveProjectPermissions(projectId: string, payload: Partial<ProjectPermissionsConfig>): Promise<ProjectPermissionsConfig> {
  const res = await fetch(base(projectId), {
    method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Failed to save the permissions');
  return body.permissions;
}
