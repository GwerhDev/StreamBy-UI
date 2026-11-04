import { API_BASE } from '../config/api';
import { Deliverable, DeliverableNodeState } from '../interfaces';

const errorOf = async (res: Response, fallback: string) => {
  try { return new Error((await res.json()).message || fallback); } catch { return new Error(fallback); }
};

export async function getDeliverables(projectId: string, of: { shotId?: string; exportId?: string } = {}): Promise<Deliverable[]> {
  const query = new URLSearchParams(Object.entries(of).filter(([, v]) => v) as [string, string][]).toString();
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/deliverables${query ? `?${query}` : ''}`, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Failed to load deliverables');
  return (await res.json()).deliverables;
}

// The state of each Deliverable node of the workflow, by node id.
export async function getDeliverableGates(projectId: string): Promise<Record<string, DeliverableNodeState>> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/deliverables/gates`, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, "Failed to load the deliverables' gates");
  return (await res.json()).nodes;
}

// A ready deliverable's waiting workers, started: the deliverable as it is then, and the jobs.
export async function startDeliverableWorkers(projectId: string, deliverableId: string): Promise<{ deliverable: Deliverable; jobs: { jobId: string }[] }> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/deliverables/${deliverableId}/start-workers`, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw await errorOf(res, "Failed to start the deliverable's workers");
  return res.json();
}

// A URL that downloads an asset's file (a version of it if given), with its name.
export async function getAssetDownloadUrl(projectId: string, assetId: string, versionId?: string | null): Promise<string> {
  const query = versionId ? `?${new URLSearchParams({ versionId })}` : '';
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/assets/${assetId}/download-url${query}`, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Failed to get the download URL');
  return (await res.json()).url;
}
