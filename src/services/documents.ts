import { API_BASE } from '../config/api';
import { DocumentKind, DocumentSummary, DocumentVersion, DocumentVersionSummary, ProjectDocument } from '../interfaces';

const base = (projectId: string, path = '') =>
  `${API_BASE}/streamby/projects/${encodeURIComponent(projectId)}/documents${path}`;
const one = (projectId: string, documentId: string, path = '') => base(projectId, `/${encodeURIComponent(documentId)}${path}`);

/** StreamBy's answer to a request it refused: its status, and what it said. */
export class ApiError extends Error {
  constructor(message: string, public status: number, public body: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (!res.ok) {
    const body: Record<string, unknown> = await res.json().catch(() => ({}));
    const said = [body.message, body.error].find((m): m is string => typeof m === 'string' && !!m);
    throw new ApiError(said ?? `HTTP ${res.status}`, res.status, body);
  }
  return res.json();
}

/** A save refused because someone saved another version since: the document as it is now. */
export const conflictOf = (err: unknown): ProjectDocument | null =>
  err instanceof ApiError && err.status === 409 ? (err.body.document as ProjectDocument) ?? null : null;

export const getDocuments = async (projectId: string): Promise<DocumentSummary[]> =>
  (await request<{ documents: DocumentSummary[] }>(base(projectId))).documents;

export const getDocument = async (projectId: string, documentId: string): Promise<ProjectDocument> =>
  (await request<{ document: ProjectDocument }>(one(projectId, documentId))).document;

export const createDocument = async (
  projectId: string,
  payload: { title: string; kind?: DocumentKind; parentId?: string | null; content?: string },
): Promise<ProjectDocument> =>
  (await request<{ document: ProjectDocument }>(base(projectId), { method: 'POST', body: JSON.stringify(payload) })).document;

/** A new version, made on `baseVersion`: refused (409, see conflictOf) if it's no longer the latest. */
export const saveDocument = async (
  projectId: string, documentId: string, baseVersion: number, change: { title?: string; content?: string },
): Promise<ProjectDocument> =>
  (await request<{ document: ProjectDocument }>(one(projectId, documentId), { method: 'PATCH', body: JSON.stringify({ baseVersion, ...change }) })).document;

/** Where it is in the tree, or whether it's exportable: not a version. */
export const updateDocument = async (
  projectId: string, documentId: string, patch: { parentId?: string | null; position?: number; exportable?: boolean },
): Promise<ProjectDocument> =>
  (await request<{ document: ProjectDocument }>(one(projectId, documentId), { method: 'PATCH', body: JSON.stringify(patch) })).document;

export const getDocumentVersions = async (projectId: string, documentId: string): Promise<DocumentVersionSummary[]> =>
  (await request<{ versions: DocumentVersionSummary[] }>(one(projectId, documentId, '/versions'))).versions;

export const getDocumentVersion = async (projectId: string, documentId: string, version: number): Promise<DocumentVersion> =>
  (await request<{ version: DocumentVersion }>(one(projectId, documentId, `/versions/${version}`))).version;

/** The version its exports deliver (null: none). */
export const publishDocument = async (projectId: string, documentId: string, version: number | null): Promise<ProjectDocument> =>
  (await request<{ document: ProjectDocument }>(one(projectId, documentId, '/publish'), { method: 'POST', body: JSON.stringify({ version }) })).document;

/** A document, or a folder with everything in it: the ids deleted. */
export const deleteDocument = async (projectId: string, documentId: string): Promise<string[]> =>
  (await request<{ deleted: string[] }>(one(projectId, documentId), { method: 'DELETE' })).deleted;
