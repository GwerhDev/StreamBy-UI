import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchDocuments } from '../../../store/documentsSlice';

// The project's documents (the tree): loaded if they aren't yet, and again whenever someone
// creates, saves or moves one. The breadcrumb names a document by it too.
export function useDocumentList(projectId: string) {
  const dispatch = useDispatch<AppDispatch>();
  const list = useSelector((state: RootState) => (state.documents.projectId === projectId ? state.documents.list : null));
  const lastEvent = useSelector((state: RootState) => state.documents.lastEvent);

  useEffect(() => {
    if (projectId && !list) dispatch(fetchDocuments(projectId));
  // Only when it isn't loaded: a change someone makes reloads it below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, projectId]);

  useEffect(() => {
    if (projectId && lastEvent?.projectId === projectId && lastEvent.action !== 'deleted') dispatch(fetchDocuments(projectId));
  }, [dispatch, projectId, lastEvent]);

  return list;
}
