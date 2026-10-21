import { API_BASE } from '../config/api';
import { ApiToken, CreateApiTokenPayload } from '../interfaces';

// A user's own tokens, or a project's (its admins only).
const baseOf = (projectId?: string) =>
  projectId
    ? `${API_BASE}/streamby/projects/${encodeURIComponent(projectId)}/api-tokens`
    : `${API_BASE}/streamby/user/api-tokens`;

const errorOf = async (res: Response, fallback: string) => {
  try { return new Error((await res.json()).message || fallback); } catch { return new Error(fallback); }
};

export async function getApiTokens(projectId?: string): Promise<ApiToken[]> {
  const res = await fetch(baseOf(projectId), { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Failed to load API tokens');
  return (await res.json()).apiTokens;
}

// The token itself comes back only here, once.
export async function createApiToken(payload: CreateApiTokenPayload, projectId?: string): Promise<{ token: string; apiToken: ApiToken }> {
  const res = await fetch(baseOf(projectId), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await errorOf(res, 'Failed to create API token');
  const { token, apiToken } = await res.json();
  return { token, apiToken };
}

export async function revokeApiToken(id: string, projectId?: string): Promise<void> {
  const res = await fetch(`${baseOf(projectId)}/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Failed to revoke API token');
}
