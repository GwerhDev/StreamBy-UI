import { API_BASE } from '../config/api';

// A project's resources as a whole: what depends on one before it's removed, and removing it
// (whichever kind).

export type ResourceKind = 'db' | 'api' | 'storage' | 'service' | 'export' | 'pipeline';

export interface Dependent {
  type: 'workflow' | 'export' | 'pipeline' | 'files' | 'folders' | 'deliverables' | 'shots';
  name: string;
  id?: string;
  count?: number;
}

const base = (projectId: string) => `${API_BASE}/streamby/projects/${encodeURIComponent(projectId)}`;

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init, headers: init.body ? { 'Content-Type': 'application/json' } : undefined });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
  return res.json();
}

export const getDependents = async (projectId: string, kind: ResourceKind, id: string): Promise<Dependent[]> =>
  (await request<{ dependents: Dependent[] }>(`${base(projectId)}/dependents/${kind}/${encodeURIComponent(id)}`)).dependents;

// Where each kind is listed on the project.
export const PROJECT_LIST: Record<ResourceKind, 'dbConnections' | 'connections' | 'storageConnections' | 'integrationConnections' | 'exports' | 'pipelines'> = {
  db: 'dbConnections', api: 'connections', storage: 'storageConnections', service: 'integrationConnections', export: 'exports', pipeline: 'pipelines',
};

type ListKey = typeof PROJECT_LIST[ResourceKind];

// Where each kind is removed, and where its answer has the list as it is now.
const REMOVAL: Record<ResourceKind, (projectId: string, resource: { id: string; integrationId?: string }) => { url: string; list: (body: any) => unknown[] }> = {
  db: (p, r) => ({ url: `${base(p)}/connections/db/${encodeURIComponent(r.id)}`, list: b => b.dbConnections }),
  storage: (p, r) => ({ url: `${base(p)}/connections/storage/${encodeURIComponent(r.id)}`, list: b => b.storageConnections }),
  service: (p, r) => ({ url: `${base(p)}/integrations/${encodeURIComponent(r.integrationId ?? r.id)}`, list: b => b.project?.integrationConnections }),
  api: (p, r) => ({ url: `${base(p)}/connections/${encodeURIComponent(r.id)}`, list: b => b.connections }),
  export: (p, r) => ({ url: `${base(p)}/exports/${encodeURIComponent(r.id)}`, list: b => b.exports }),
  pipeline: (p, r) => ({ url: `${base(p)}/pipelines/${encodeURIComponent(r.id)}`, list: b => b.pipelines }),
};

/** Removes it from the project (a service by its integration): the list it was in, as it is now. */
export async function removeResource(projectId: string, kind: ResourceKind, resource: { id: string; integrationId?: string }): Promise<{ key: ListKey; value: unknown[] }> {
  const { url, list } = REMOVAL[kind](projectId, resource);
  const body = await request<unknown>(url, { method: 'DELETE' });
  return { key: PROJECT_LIST[kind], value: list(body) ?? [] };
}
