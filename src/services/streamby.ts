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
  return await res.json();
}

export async function getUploadUrl(projectId: string, filename: string, contentType: string) {
  const res = await fetch(`${API_BASE}/streamby/upload-url`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ filename, contentType, projectId })
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
