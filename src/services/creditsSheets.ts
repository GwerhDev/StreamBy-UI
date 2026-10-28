import { API_BASE } from '../config/api';
import { CreditsSheet, CreditsSheetSummary } from '../interfaces';

const base = (projectId: string, path = '') =>
  `${API_BASE}/streamby/projects/${encodeURIComponent(projectId)}/credits-sheets${path}`;

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
  return res.json();
}

/** The project's credits sheets, each with its status. */
export const getCreditsSheets = async (projectId: string): Promise<CreditsSheetSummary[]> =>
  (await request<{ sheets: CreditsSheetSummary[] }>(base(projectId))).sheets;

/** A credits sheet: its rows, read now from its assets' license metadata, and its status. */
export const getCreditsSheet = (projectId: string, documentId: string): Promise<CreditsSheet> =>
  request<CreditsSheet>(base(projectId, `/${encodeURIComponent(documentId)}`));
