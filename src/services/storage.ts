import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';
import { StorageCategory } from '../interfaces';

export async function getStorageFiles(projectId: string, category: StorageCategory) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/storage/${category}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch storage files');
    }

    const { data } = await res.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching storage files:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch storage files.', type: 'error' }));
    return [];
  }
}

export async function getStorageUploadUrl(projectId: string, category: StorageCategory, fileName: string, contentType: string) {
  try {
    const params = new URLSearchParams({ fileName, contentType });
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/storage/${category}/upload-url?${params}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to get upload URL');
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error getting upload URL:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to get upload URL.', type: 'error' }));
    throw error;
  }
}

export async function uploadToPresignedUrl(url: string, file: File, contentType: string) {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to upload file to storage');
    }

    return true;
  } catch (error: any) {
    console.error('Error uploading to presigned URL:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to upload file.', type: 'error' }));
    throw error;
  }
}

export async function renameStorageFile(projectId: string, fileId: string, displayName: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/storage/files/${fileId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to rename file');
    }

    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message || 'File renamed successfully.', type: 'success' }));
    return response.file;
  } catch (error: any) {
    console.error('Error renaming file:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to rename file.', type: 'error' }));
    throw error;
  }
}

export async function deleteStorageFile(projectId: string, fileId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/storage/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to delete file');
    }

    const response = await res.json();
    store.dispatch(addApiResponse({ message: response.message || 'File deleted successfully.', type: 'success' }));
    return response;
  } catch (error: any) {
    console.error('Error deleting file:', error);
    store.dispatch(addApiResponse({ message: error.message || 'Failed to delete file.', type: 'error' }));
    throw error;
  }
}
