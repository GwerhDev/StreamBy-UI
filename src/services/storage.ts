import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';
import { StorageCategory, StorageFile, StorageFolder } from '../interfaces';

const CONN_BASE = (projectId: string, connId: string) =>
  `${API_BASE}/streamby/projects/${projectId}/connections/storage/${connId}`;

export async function getStorageFiles(projectId: string, connId: string, category: StorageCategory) {
  try {
    const res = await fetch(`${CONN_BASE(projectId, connId)}/files/${category}`, {
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

export async function getStorageCategoryStats(
  projectId: string,
  connId: string
): Promise<Record<string, { count: number; size: number }>> {
  const categories: StorageCategory[] = ['images', 'audios', 'videos', '3d-models'];
  const results = await Promise.all(
    categories.map(async cat => {
      const files: StorageFile[] = await getStorageFiles(projectId, connId, cat);
      return { cat, count: files.length, size: files.reduce((s, f) => s + (f.size ?? 0), 0) };
    })
  );
  return Object.fromEntries(results.map(r => [r.cat, { count: r.count, size: r.size }]));
}

export async function getStorageUploadUrl(projectId: string, connId: string, category: StorageCategory, fileName: string, contentType: string) {
  try {
    const params = new URLSearchParams({ fileName, contentType, category });
    const res = await fetch(`${CONN_BASE(projectId, connId)}/upload-url?${params}`, {
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

export async function renameStorageFile(projectId: string, connId: string, fileId: string, displayName: string) {
  try {
    const res = await fetch(`${CONN_BASE(projectId, connId)}/files/${fileId}`, {
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

export async function getStorageReplaceUrl(
  projectId: string,
  connId: string,
  fileId: string,
  contentType: string,
  fileName: string,
) {
  try {
    const params = new URLSearchParams({ contentType, fileName });
    const res = await fetch(`${CONN_BASE(projectId, connId)}/files/${fileId}/replace-url?${params}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to get replace URL');
    }

    return await res.json() as { url: string; storageKey: string; fileId: string };
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to get replace URL.', type: 'error' }));
    throw error;
  }
}

export async function deleteStorageFile(projectId: string, connId: string, fileId: string) {
  try {
    const res = await fetch(`${CONN_BASE(projectId, connId)}/files/${fileId}`, {
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

export async function getStorageFolderById(
  projectId: string,
  connId: string,
  folderId: string,
): Promise<StorageFolder | null> {
  try {
    const res = await fetch(`${CONN_BASE(projectId, connId)}/folders/${folderId}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error((await res.json()).message);
    const { folder } = await res.json();
    return folder ?? null;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch folder.', type: 'error' }));
    return null;
  }
}

export async function getStorageFolders(
  projectId: string,
  connId: string,
  parentId?: string | null,
): Promise<StorageFolder[]> {
  try {
    const params = new URLSearchParams({ parentId: parentId === null || parentId === undefined ? 'null' : parentId });
    const res = await fetch(`${CONN_BASE(projectId, connId)}/folders?${params}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error((await res.json()).message);
    const { data } = await res.json();
    return data ?? [];
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch folders.', type: 'error' }));
    return [];
  }
}

export async function createStorageFolder(
  projectId: string,
  connId: string,
  name: string,
  parentId?: string | null,
): Promise<StorageFolder | null> {
  try {
    const res = await fetch(`${CONN_BASE(projectId, connId)}/folders`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId: parentId ?? null }),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    const { folder } = await res.json();
    store.dispatch(addApiResponse({ message: 'Folder created.', type: 'success' }));
    return folder;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to create folder.', type: 'error' }));
    return null;
  }
}

export async function renameStorageFolder(
  projectId: string,
  connId: string,
  folderId: string,
  name: string,
): Promise<StorageFolder | null> {
  try {
    const res = await fetch(`${CONN_BASE(projectId, connId)}/folders/${folderId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    const { folder } = await res.json();
    store.dispatch(addApiResponse({ message: 'Folder renamed.', type: 'success' }));
    return folder;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to rename folder.', type: 'error' }));
    return null;
  }
}

export async function deleteStorageFolder(
  projectId: string,
  connId: string,
  folderId: string,
): Promise<void> {
  try {
    const res = await fetch(`${CONN_BASE(projectId, connId)}/folders/${folderId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error((await res.json()).message);
    store.dispatch(addApiResponse({ message: 'Folder deleted.', type: 'success' }));
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to delete folder.', type: 'error' }));
  }
}

export async function moveStorageFolder(
  projectId: string,
  connId: string,
  folderId: string,
  newParentId: string | null,
): Promise<void> {
  try {
    const res = await fetch(`${CONN_BASE(projectId, connId)}/folders/${folderId}/move`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newParentId }),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    store.dispatch(addApiResponse({ message: 'Folder moved.', type: 'success' }));
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to move folder.', type: 'error' }));
  }
}

export async function moveStorageFile(
  projectId: string,
  connId: string,
  fileId: string,
  folderId: string | null,
): Promise<void> {
  try {
    const res = await fetch(`${CONN_BASE(projectId, connId)}/files/${fileId}/move`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) throw new Error((await res.json()).message);
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to move file.', type: 'error' }));
  }
}
