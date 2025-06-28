import { NavigateFunction } from "react-router-dom";
import { API_BASE } from "../config/api";

export async function createProject(payload: { name: string; description?: string }) {
  const res = await fetch(`${API_BASE}/streamby/projects/create`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to create project');
  const response = await res.json();
  return response;
}

export async function uploadProjectImage(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/upload-project-image-url/${projectId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
  });

  if (!res.ok) throw new Error('Failed to get presigned URL');
  return await res.json();
}

export async function uploadToPresignedUrl(url: string, file: File, contentType: string) {
  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType
    }
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return true;
}

export async function updateProject(projectId: string, payload: { name: string; description?: string }) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error('Failed to update project');
  return await res.json();
}

export async function updateProjectImage(projectId: string, imageKey: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageKey }),
  });

  if (!res.ok) throw new Error('Failed to update project image');
  return await res.json();
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/streamby/projects`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to fetch projects');
  const { projects } = await res.json() || {};
  return projects;
}

export async function fetchProject(projectId: string, navigate: NavigateFunction) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    navigate('/project/not-found');
    throw new Error('Failed to fetch project');
  };
  const { project } = await res.json();
  return project;
}

export async function deleteProject(projectId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to delete project');
    return await res.json();
  } catch (error) {
    console.error(error);
  }
}

export async function archiveProject(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/archive`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  
  if (!res.ok) throw new Error('Failed to archive project');
  return await res.json();
}

export async function unarchiveProject(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/unarchive`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
  });

  if (!res.ok) throw new Error('Failed to unarchive project');
  return await res.json();
}

export async function fetchProjectMembers(projectId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`Failed to fetch project members: ${error} - ${details}`);
    }
    const { members } = await res.json();
    return members;
  } catch (error) {
    console.error('Error fetching project members:', error);
    throw error;
  }
}
