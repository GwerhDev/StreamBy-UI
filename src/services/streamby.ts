import { API_BASE } from '../config/api';

export async function fetchProject(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Project not found');
  const data = await res.json();
  return data.project;
}

export async function fetchFiles(projectId: string) {
  const res = await fetch(`${API_BASE}/files?projectId=${projectId}`, {
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to list files');
  return await res.json();
}
