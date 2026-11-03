import { API_BASE } from '../config/api';
import { Team } from '../interfaces';

const base = (projectId: string) => `${API_BASE}/streamby/projects/${projectId}/teams`;

// Each change answers the project's teams as they are then.
async function teamsOf(res: Response, fallback: string): Promise<Team[]> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || fallback);
  return body.teams;
}

export async function getTeams(projectId: string): Promise<Team[]> {
  return teamsOf(await fetch(base(projectId), { credentials: 'include' }), 'Failed to load the teams');
}

export async function createTeam(projectId: string, payload: { name: string; memberIds: string[] }): Promise<Team[]> {
  return teamsOf(await fetch(base(projectId), {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }), 'Failed to create the team');
}

export async function updateTeam(projectId: string, teamId: string, payload: { name?: string; memberIds?: string[] }): Promise<Team[]> {
  return teamsOf(await fetch(`${base(projectId)}/${teamId}`, {
    method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }), 'Failed to save the team');
}

export async function deleteTeam(projectId: string, teamId: string): Promise<Team[]> {
  return teamsOf(await fetch(`${base(projectId)}/${teamId}`, { method: 'DELETE', credentials: 'include' }), 'Failed to delete the team');
}
