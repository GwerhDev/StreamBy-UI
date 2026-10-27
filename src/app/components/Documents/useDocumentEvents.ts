import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { DocumentEvent } from '../../../interfaces';

// The changes someone makes to one document from now on (not those before it was opened), as
// the websocket brings them.
export function useDocumentEvents(projectId: string, documentId: string, onEvent: (event: DocumentEvent) => void) {
  const lastEvent = useSelector((state: RootState) => state.documents.lastEvent);
  const seen = useRef(lastEvent);
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!lastEvent || lastEvent === seen.current) return;
    seen.current = lastEvent;
    if (lastEvent.projectId === projectId && lastEvent.documentIds.includes(documentId)) handler.current(lastEvent);
  }, [lastEvent, projectId, documentId]);
}
