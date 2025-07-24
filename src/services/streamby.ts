import { NavigateFunction } from "react-router-dom";
import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';

export async function createProject(payload: { name: string; description?: string; dbType: string }) {
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
    store.dispatch(addApiResponse({ message: 'Project created successfully.', type: 'success' }));
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
    store.dispatch(addApiResponse({ message: 'Presigned URL fetched successfully.', type: 'success' }));
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
    store.dispatch(addApiResponse({ message: 'Image uploaded successfully.', type: 'success' }));
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
    store.dispatch(addApiResponse({ message: 'Project updated successfully.', type: 'success' }));
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
    store.dispatch(addApiResponse({ message: 'Project image updated successfully.', type: 'success' }));
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
    store.dispatch(addApiResponse({ message: 'Projects fetched successfully.', type: 'success' }));
    return projects;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch projects.', type: 'error' }));
    throw error;
  }
}

export async function fetchProject(projectId: string, navigate: NavigateFunction) {
  try {
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
    store.dispatch(addApiResponse({ message: 'Project fetched successfully.', type: 'success' }));
    return project;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch project.', type: 'error' }));
    throw error;
  }
}

export async function deleteProject(projectId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to delete project');
    }
    const response = await res.json();
    store.dispatch(addApiResponse({ message: 'Project deleted successfully.', type: 'success' }));
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
    store.dispatch(addApiResponse({ message: 'Project archived successfully.', type: 'success' }));
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
    store.dispatch(addApiResponse({ message: 'Project unarchived successfully.', type: 'success' }));
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
    store.dispatch(addApiResponse({ message: 'Project members fetched successfully.', type: 'success' }));
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
    const { databases } = await res.json() || {};
    store.dispatch(addApiResponse({ message: 'Databases fetched successfully.', type: 'success' }));
    return databases;
  } catch (error: any) {
    console.error(error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch databases.', type: 'error' }));
    throw error;
  }
}
