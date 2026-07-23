import { API_BASE } from "../config/api";

export async function exploreProjects() {
  const res = await fetch(`${API_BASE}/streamby/projects/explore`, { credentials: 'include' });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to explore projects');
  }
  const { projects } = await res.json();
  return projects;
}

export async function createProject(payload: { name: string; description?: string; allowedOrigin?: string[]; public: boolean; category?: string | null; integrationIds?: string[] }) {
  const res = await fetch(`${API_BASE}/streamby/projects/create`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to create project');
  }
  return res.json();
}

export async function addProjectIntegration(projectId: string, integrationId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/integrations`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to add integration');
  }
  return res.json();
}

export async function removeProjectIntegration(projectId: string, integrationId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/integrations/${integrationId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to remove integration');
  }
  return res.json();
}

export async function uploadProjectImage(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/upload-project-image-url/${projectId}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to get presigned URL');
  }
  return res.json();
}

export async function uploadToPresignedUrl(url: string, file: File, contentType: string) {
  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to upload image');
  }
  return true;
}

export async function updateProject(projectId: string, payload: { name: string; description?: string; allowedOrigin?: string[]; public: boolean; category?: string | null }) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update project');
  }
  return res.json();
}

export async function updateProjectImage(projectId: string, imageKey: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageKey }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update project image');
  }
  return res.json();
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/streamby/projects`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch projects');
  }
  const { projects } = await res.json() || {};
  return projects;
}

export async function fetchProject(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch project');
  }
  const { project } = await res.json();
  return project;
}

export async function fetchProjectPreview(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/preview`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch project preview');
  }
  const { project, membership } = await res.json();
  return { project, membership };
}

export async function deleteProject(projectId: string | undefined) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete project');
  }
  return res.json();
}

export async function archiveProject(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/archive`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to archive project');
  }
  return res.json();
}

export async function unarchiveProject(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/unarchive`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to unarchive project');
  }
  return res.json();
}

export async function fetchProjectMembers(projectId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch project members');
  }
  const { members } = await res.json();
  return members;
}

export async function updateProjectOrigins(projectId: string, origins: string[]) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/origins`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origins }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update project origins');
  }
  const { project } = await res.json();
  return project;
}

export async function createCredential(projectId: string, key: string, value: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/credentials`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to create credential');
  }
  return res.json();
}

export async function fetchCredential(projectId: string, credentialId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/credentials/${credentialId}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch credential');
  }
  const { credential } = await res.json();
  return credential;
}

export async function updateCredential(projectId: string, credentialId: string, payload: { key?: string; value?: string }) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/credentials/${credentialId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update credential');
  }
  return res.json();
}

export async function deleteCredential(projectId: string, credentialId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/credentials/${credentialId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete credential');
  }
  return res.json();
}
