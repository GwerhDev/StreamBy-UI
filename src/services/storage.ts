import { API_BASE } from "../config/api";
import { resolveContentType } from '../utils/contentType';
import { AssetMetadata, AssetRights, LicenseMetadata, StorageCategory, StorageFile, StorageFolder } from '../interfaces';

const CONN_BASE = (projectId: string, connId: string) =>
  `${API_BASE}/streamby/projects/${projectId}/connections/storage/${connId}`;

export async function getStorageFiles(projectId: string, connId: string, category: StorageCategory): Promise<StorageFile[]> {
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
}

export async function getStorageCategoryStats(
  projectId: string,
  connId: string
): Promise<Record<string, { count: number; size: number }>> {
  const categories: StorageCategory[] = ['images', 'audios', 'videos', '3d-models'];
  const results = await Promise.all(
    categories.map(async cat => {
      try {
        const files: StorageFile[] = await getStorageFiles(projectId, connId, cat);
        return { cat, count: files.length, size: files.reduce((s, f) => s + (f.size ?? 0), 0) };
      } catch {
        return { cat, count: 0, size: 0 };
      }
    })
  );
  return Object.fromEntries(results.map(r => [r.cat, { count: r.count, size: r.size }]));
}

// The headers an upload URL is answered with, to send its file with: its content type, and the
// SHA-256 it was declared with, for the storage to check the bytes against.
export type UploadUrl = { url: string; fileId: string; storageKey?: string; headers?: Record<string, string> };

/** A file's SHA-256, in hex: declared with its upload, so an export's catalog can list it. */
export async function fileSha256(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

// With license metadata, the new asset is saved with it (the fields given, empty ones left out).
export async function getStorageUploadUrl(
  projectId: string, connId: string, category: StorageCategory, fileName: string, contentType: string,
  license?: Partial<LicenseMetadata>, sha256?: string,
): Promise<UploadUrl> {
  const given = Object.entries(license ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && !!entry[1].trim());
  const params = new URLSearchParams({ fileName, contentType, category, ...Object.fromEntries(given), ...(sha256 ? { sha256 } : {}) });
  const res = await fetch(`${CONN_BASE(projectId, connId)}/upload-url?${params}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to get upload URL');
  }
  return res.json();
}

// headers: the ones its upload URL was answered with (they carry its declared hash).
export async function uploadToPresignedUrl(url: string, file: File, contentType: string, headers?: Record<string, string>) {
  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: headers ?? { 'Content-Type': contentType },
  });
  if (!res.ok) {
    throw new Error('Failed to upload file to storage');
  }
  return true;
}

/**
 * Uploads a new asset, its SHA-256 declared with it, with its content type resolved from its
 * extension when the browser has none for it. What its upload URL was answered with.
 */
export async function uploadStorageFile(
  projectId: string, connId: string, category: StorageCategory, file: File,
  license?: Partial<LicenseMetadata>,
): Promise<UploadUrl> {
  const contentType = resolveContentType(file);
  const sha256 = await fileSha256(file);
  const answer = await getStorageUploadUrl(projectId, connId, category, file.name, contentType, license, sha256);
  await uploadToPresignedUrl(answer.url, file, contentType, answer.headers);
  return answer;
}

/** Uploads a new version of an asset, its SHA-256 and its content type as uploadStorageFile does. */
export async function replaceStorageFile(projectId: string, connId: string, fileId: string, file: File): Promise<void> {
  const contentType = resolveContentType(file);
  const sha256 = await fileSha256(file);
  const { url, headers } = await getStorageReplaceUrl(projectId, connId, fileId, contentType, file.name, sha256);
  await uploadToPresignedUrl(url, file, contentType, headers);
}

export async function renameStorageFile(projectId: string, connId: string, fileId: string, displayName: string) {
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
  return response.file;
}

export async function getStorageReplaceUrl(
  projectId: string,
  connId: string,
  fileId: string,
  contentType: string,
  fileName: string,
  sha256?: string,
): Promise<{ url: string; storageKey: string; fileId: string; headers?: Record<string, string> }> {
  const params = new URLSearchParams({ contentType, fileName, ...(sha256 ? { sha256 } : {}) });
  const res = await fetch(`${CONN_BASE(projectId, connId)}/files/${fileId}/replace-url?${params}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to get replace URL');
  }
  return res.json();
}

export async function deleteStorageFile(projectId: string, connId: string, fileId: string) {
  const res = await fetch(`${CONN_BASE(projectId, connId)}/files/${fileId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete file');
  }
  return res.json();
}

export async function getStorageFolderById(
  projectId: string,
  connId: string,
  folderId: string,
): Promise<StorageFolder | null> {
  const res = await fetch(`${CONN_BASE(projectId, connId)}/folders/${folderId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { folder } = await res.json();
  return folder ?? null;
}

export async function getStorageFolders(
  projectId: string,
  connId: string,
  parentId?: string | null,
): Promise<StorageFolder[]> {
  const params = new URLSearchParams({ parentId: parentId === null || parentId === undefined ? 'null' : parentId });
  const res = await fetch(`${CONN_BASE(projectId, connId)}/folders?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data ?? [];
}

export async function createStorageFolder(
  projectId: string,
  connId: string,
  name: string,
  parentId?: string | null,
): Promise<StorageFolder> {
  const res = await fetch(`${CONN_BASE(projectId, connId)}/folders`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parentId: parentId ?? null }),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { folder } = await res.json();
  return folder;
}

export async function renameStorageFolder(
  projectId: string,
  connId: string,
  folderId: string,
  name: string,
): Promise<StorageFolder> {
  const res = await fetch(`${CONN_BASE(projectId, connId)}/folders/${folderId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { folder } = await res.json();
  return folder;
}

export async function deleteStorageFolder(
  projectId: string,
  connId: string,
  folderId: string,
): Promise<void> {
  const res = await fetch(`${CONN_BASE(projectId, connId)}/folders/${folderId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message);
}

export async function moveStorageFolder(
  projectId: string,
  connId: string,
  folderId: string,
  newParentId: string | null,
): Promise<void> {
  const res = await fetch(`${CONN_BASE(projectId, connId)}/folders/${folderId}/move`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newParentId }),
  });
  if (!res.ok) throw new Error((await res.json()).message);
}

export async function moveStorageFile(
  projectId: string,
  connId: string,
  fileId: string,
  folderId: string | null,
): Promise<void> {
  const res = await fetch(`${CONN_BASE(projectId, connId)}/files/${fileId}/move`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId }),
  });
  if (!res.ok) throw new Error((await res.json()).message);
}

// ── Asset metadata ────────────────────────────────────────────────────────────

// An asset's metadata (its custom tags among them), or null when it has none yet.
export async function getAssetMetadata(projectId: string, assetId: string): Promise<AssetMetadata | null> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/assets/${assetId}/metadata`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
  const { metadata } = await res.json();
  return metadata;
}

// ── Asset Rights ──────────────────────────────────────────────────────────────

export async function getAssetRights(projectId: string, assetId: string): Promise<AssetRights | null> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/assets/${assetId}/rights`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
  const { rights } = await res.json();
  return rights;
}

export async function putAssetRights(
  projectId: string,
  assetId: string,
  payload: Partial<LicenseMetadata>,
): Promise<AssetRights> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/assets/${assetId}/rights`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
  const { rights } = await res.json();
  return rights;
}
