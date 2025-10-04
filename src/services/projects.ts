import { NavigateFunction } from "react-router-dom";
import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';

export async function createProject(payload: { name: string; description?: string; dbType: string; allowedOrigin?: string[] }) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/create`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to create project');
    }
    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to create project.', type: 'error' }));
    throw error;
  }
}

export async function uploadProjectImage(projectId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/upload-project-image-url/${projectId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to get presigned URL');
    }
    const response = await res.json();
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to get presigned URL.', type: 'error' }));
    throw error;
  }
}

export async function uploadToPresignedUrl(url: string, file: File, contentType: string) {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType
      }
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to upload image');
    }
    return true;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to upload image.', type: 'error' }));
    throw error;
  }
}

export async function updateProject(projectId: string, payload: { name: string; description?: string }) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to update project');
    }
    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to update project.', type: 'error' }));
    throw error;
  }
}

export async function updateProjectImage(projectId: string, imageKey: string) {
  try {
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
    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to update project image.', type: 'error' }));
    throw error;
  }
}

export async function fetchProjects() {
  try {
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
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch projects.', type: 'error' }));
    throw error;
  }
}

export async function fetchProject(projectId: string | undefined, navigate: NavigateFunction) {
  try {
    if (!projectId) {
      navigate('/project/not-found');
      return;
    }

    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      navigate('/project/not-found');
      throw new Error(errorData.message || 'Failed to fetch project');
    };
    const { project } = await res.json();
    return project;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch project.', type: 'error' }));
    throw error;
  }
}

export async function deleteProject(projectId: string | undefined) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to delete project.', type: 'error' }));
    throw error;
  }
}

export async function archiveProject(projectId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/archive`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to archive project');
    }
    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to archive project.', type: 'error' }));
    throw error;
  }
}

export async function unarchiveProject(projectId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/unarchive`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to unarchive project');
    }
    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to unarchive project.', type: 'error' }));
    throw error;
  }
}

export async function fetchProjectMembers(projectId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Failed to fetch project members`);
    }
    const { members } = await res.json();
    return members;
  } catch (error: any) {
    console.error('Error fetching project members:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch project members.', type: 'error' }));
    throw error;
  }
}

export async function getDatabases() {
  try {
    const res = await fetch(`${API_BASE}/streamby/databases`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch databases');
    }
    const response = await res.json() || {};
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response.databases;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch databases.', type: 'error' }));
    throw error;
  }
}

export async function createCredential(projectId: string, key: string, value: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/credentials`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to create credential');
    }
    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to create credential.', type: 'error' }));
    throw error;
  }
}

export async function fetchCredential(projectId: string, credentialId: string) {
  try {
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
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch credential.', type: 'error' }));
    throw error;
  }
}

export async function updateCredential(projectId: string, credentialId: string, payload: { key?: string; value?: string }) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/credentials/${credentialId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to update credential');
    }
    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to update credential.', type: 'error' }));
    throw error;
  }
}

export async function deleteCredential(projectId: string, credentialId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/credentials/${credentialId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to delete credential');
    }
    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message, type: 'success' }));
    return response;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to delete credential.', type: 'error' }));
    throw error;
  }
}
