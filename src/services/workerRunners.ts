import { API_BASE } from '../config/api';
import { WorkerRunner, WorkerRunnerShare } from '../interfaces';

// The user's own runners: managed with their session only.
const BASE = `${API_BASE}/streamby/user/runners`;

const errorOf = async (res: Response, fallback: string) => {
  try { return new Error((await res.json()).message || fallback); } catch { return new Error(fallback); }
};

const send = (url: string, method: string, body?: object) => fetch(url, {
  method, credentials: 'include',
  ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
});

export async function getWorkerRunners(): Promise<WorkerRunner[]> {
  const res = await fetch(BASE, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Failed to load runners');
  return (await res.json()).data;
}

// Its token comes back only here, once.
export async function registerWorkerRunner(name: string): Promise<{ token: string; runner: WorkerRunner }> {
  const res = await send(BASE, 'POST', { name });
  if (!res.ok) throw await errorOf(res, 'Failed to register the runner');
  const { token, data } = await res.json();
  return { token, runner: data };
}

export async function revokeWorkerRunner(runnerId: string): Promise<void> {
  const res = await send(`${BASE}/${encodeURIComponent(runnerId)}`, 'DELETE');
  if (!res.ok) throw await errorOf(res, 'Failed to revoke the runner');
}

// With a whole project, or only one of its teams.
export async function shareWorkerRunner(runnerId: string, projectId: string, teamId: string | null): Promise<WorkerRunnerShare> {
  const res = await send(`${BASE}/${encodeURIComponent(runnerId)}/shares`, 'POST', { projectId, ...(teamId ? { teamId } : {}) });
  if (!res.ok) throw await errorOf(res, 'Failed to share the runner');
  return (await res.json()).data;
}

export async function unshareWorkerRunner(runnerId: string, shareId: string): Promise<void> {
  const res = await send(`${BASE}/${encodeURIComponent(runnerId)}/shares/${encodeURIComponent(shareId)}`, 'DELETE');
  if (!res.ok) throw await errorOf(res, 'Failed to stop sharing the runner');
}
