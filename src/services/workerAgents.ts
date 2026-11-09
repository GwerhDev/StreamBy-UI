import { API_BASE } from '../config/api';
import { WorkerAgent, WorkerAgentShare } from '../interfaces';

// The user's own agents: managed with their session only.
const BASE = `${API_BASE}/streamby/user/worker-agents`;

const errorOf = async (res: Response, fallback: string) => {
  try { return new Error((await res.json()).message || fallback); } catch { return new Error(fallback); }
};

const send = (url: string, method: string, body?: object) => fetch(url, {
  method, credentials: 'include',
  ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
});

export async function getWorkerAgents(): Promise<WorkerAgent[]> {
  const res = await fetch(BASE, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Failed to load agents');
  return (await res.json()).data;
}

// Its token comes back only here, once.
export async function registerWorkerAgent(name: string): Promise<{ token: string; agent: WorkerAgent }> {
  const res = await send(BASE, 'POST', { name });
  if (!res.ok) throw await errorOf(res, 'Failed to register the agent');
  const { token, data } = await res.json();
  return { token, agent: data };
}

export async function revokeWorkerAgent(agentId: string): Promise<void> {
  const res = await send(`${BASE}/${encodeURIComponent(agentId)}`, 'DELETE');
  if (!res.ok) throw await errorOf(res, 'Failed to revoke the agent');
}

// With a whole project, or only one of its teams.
export async function shareWorkerAgent(agentId: string, projectId: string, teamId: string | null): Promise<WorkerAgentShare> {
  const res = await send(`${BASE}/${encodeURIComponent(agentId)}/shares`, 'POST', { projectId, ...(teamId ? { teamId } : {}) });
  if (!res.ok) throw await errorOf(res, 'Failed to share the agent');
  return (await res.json()).data;
}

export async function unshareWorkerAgent(agentId: string, shareId: string): Promise<void> {
  const res = await send(`${BASE}/${encodeURIComponent(agentId)}/shares/${encodeURIComponent(shareId)}`, 'DELETE');
  if (!res.ok) throw await errorOf(res, 'Failed to stop sharing the agent');
}
