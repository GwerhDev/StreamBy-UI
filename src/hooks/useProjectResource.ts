import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch } from '../store';
import { Project } from '../interfaces';
import { setProjectResource } from '../store/currentProjectSlice';
import { addApiResponse } from '../store/apiResponsesSlice';

// A section showing one of the project's resources fetches it from its own endpoint every
// time it's shown (what someone else changed shows up), into the project the rest of the UI
// reads, so the menu and the section never disagree. The project as last loaded stays shown
// meanwhile.
export function useProjectResource<K extends keyof Project>(key: K, fetcher: (projectId: string) => Promise<Project[K]>) {
  const dispatch = useDispatch<AppDispatch>();
  const { id: projectId } = useParams();
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetcherRef.current(projectId)
      .then(value => { if (!cancelled) dispatch(setProjectResource({ projectId, key, value })); })
      .catch((error: Error) => { if (!cancelled) dispatch(addApiResponse({ message: error.message || `Failed to load ${String(key)}.`, type: 'error' })); });
    return () => { cancelled = true; };
  }, [projectId, key, dispatch]);
}
