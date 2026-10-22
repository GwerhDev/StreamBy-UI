import { API_BASE } from '../config/api';
import { Deliverable } from '../interfaces';

const errorOf = async (res: Response, fallback: string) => {
  try { return new Error((await res.json()).message || fallback); } catch { return new Error(fallback); }
};

export async function getDeliverables(projectId: string, of: { shotId?: string; exportId?: string } = {}): Promise<Deliverable[]> {
  const query = new URLSearchParams(Object.entries(of).filter(([, v]) => v) as [string, string][]).toString();
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/deliverables${query ? `?${query}` : ''}`, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Failed to load deliverables');
  return (await res.json()).deliverables;
}

// A URL that downloads an asset's file (a version of it if given), with its name.
export async function getAssetDownloadUrl(projectId: string, assetId: string, versionId?: string | null): Promise<string> {
  const query = versionId ? `?${new URLSearchParams({ versionId })}` : '';
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/assets/${assetId}/download-url${query}`, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Failed to get the download URL');
  return (await res.json()).url;
}
