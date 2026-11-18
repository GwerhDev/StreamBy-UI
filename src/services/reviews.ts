import { API_BASE } from '../config/api';
import { Annotation, ReviewSession } from '../interfaces';

const errorOf = async (res: Response, fallback: string) => {
  try { return new Error((await res.json()).message || fallback); } catch { return new Error(fallback); }
};
const notesOf = (projectId: string, assetId: string, versionId: string) =>
  `${API_BASE}/streamby/projects/${projectId}/assets/${assetId}/versions/${versionId}/annotations`;
const json = (method: string, body: unknown): RequestInit => ({
  method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

export async function getReview(projectId: string, reviewId: string): Promise<ReviewSession> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/reviews/${reviewId}`, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Review session not found.');
  return (await res.json()).review;
}

/** A version's notes, oldest first. */
export async function getNotes(projectId: string, assetId: string, versionId: string): Promise<Annotation[]> {
  const res = await fetch(notesOf(projectId, assetId, versionId), { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, "Couldn't load the notes");
  return (await res.json()).annotations;
}

/** A note on an instant of an audio version, or a range of it (seconds from its start). */
export async function addTimedNote(
  projectId: string, assetId: string, versionId: string,
  note: { startSeconds: number; endSeconds?: number; text: string },
): Promise<Annotation> {
  const res = await fetch(notesOf(projectId, assetId, versionId), json('POST', { type: 'timecoded', ...note }));
  if (!res.ok) throw await errorOf(res, "Couldn't add the note");
  return (await res.json()).annotation;
}

export async function resolveNote(projectId: string, assetId: string, versionId: string, noteId: string): Promise<void> {
  const res = await fetch(`${notesOf(projectId, assetId, versionId)}/${noteId}/resolve`, { method: 'PATCH', credentials: 'include' });
  if (!res.ok) throw await errorOf(res, "Couldn't resolve the note");
}

export interface CardChoice { id: string; key: string | null; name: string }

/**
 * A note made a task of the card its asset is linked to. With several cards linked and none
 * given, `choose` lists them; with none linked, the reason it can't.
 */
export async function noteToTask(
  projectId: string, assetId: string, versionId: string, noteId: string, shotId?: string,
): Promise<{ annotation: Annotation } | { choose: CardChoice[] }> {
  const res = await fetch(`${notesOf(projectId, assetId, versionId)}/${noteId}/task`, json('POST', shotId ? { shotId } : {}));
  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    if (Array.isArray(body.shots)) return { choose: body.shots };
    throw new Error(body.message || "Couldn't make it a task");
  }
  if (!res.ok) throw await errorOf(res, "Couldn't make it a task");
  return { annotation: (await res.json()).annotation };
}
