import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { CreditsSheet } from '../../../interfaces';
import { getCreditsSheet } from '../../../services/creditsSheets';
import { useDocumentEvents } from '../Documents/useDocumentEvents';

// A credits sheet, kept current: read again when its sources change or when any asset's
// license metadata in the project does (another sheet, the Rights tab, an agent).
export function useCreditsSheet(projectId: string, documentId: string) {
  const [sheet, setSheet] = useState<CreditsSheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const mine = ++latest.current;
    try {
      const loaded = await getCreditsSheet(projectId, documentId);
      if (mine === latest.current) { setSheet(loaded); setError(null); }
      return loaded;
    } catch (err) {
      if (mine === latest.current) setError(err instanceof Error ? err.message : 'Failed to load the credits sheet.');
      return null;
    }
  }, [projectId, documentId]);

  useEffect(() => {
    setSheet(null);
    setError(null);
    if (projectId && documentId) load();
  }, [load, projectId, documentId]);

  const eventSeq = useSelector((state: RootState) => state.creditsSheets.eventSeq);
  const lastEvent = useSelector((state: RootState) => state.creditsSheets.lastEvent);
  const seenSeq = useRef(eventSeq);
  useEffect(() => {
    if (eventSeq === seenSeq.current) return;
    seenSeq.current = eventSeq;
    if (lastEvent?.projectId === projectId) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSeq]);

  useDocumentEvents(projectId, documentId, () => { load(); });

  return { sheet, error, load };
}
