import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchProject } from '../services/projects';
import { setCurrentProject, setProjectLoading } from '../store/currentProjectSlice';
import { useFormSaved } from './useFormRoute';

export function useProjectInit(projectId: string | undefined) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const session = useSelector((state: RootState) => state.session);

  // useNavigate() returns a new function on every location change: as a dependency, every
  // navigation inside the project set it back to loading (every list to its skeleton).
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const userIdRef = useRef(session.userId);
  userIdRef.current = session.userId;

  useEffect(() => {
    if (!projectId) {
      navigateRef.current('/project/not-found');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        dispatch(setProjectLoading());
        const data = await fetchProject(projectId);
        if (cancelled) return;
        dispatch(setCurrentProject(data));

        const selfMember = data?.members?.find((m: { userId: string }) => m.userId === userIdRef.current);
        if (selfMember?.status === 'pending') {
          navigateRef.current(`/preview/${projectId}`, { replace: true });
        }
      } catch {
        if (!cancelled) navigateRef.current('/project/not-found');
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, dispatch]);
}

// The whole project again, in the background (no loading): for a view that shows all of it,
// such as its overview. Each section of a single resource fetches that one instead (see
// useProjectResource).
export function useProjectRefresh() {
  const dispatch = useDispatch<AppDispatch>();
  const { id: projectId } = useParams();
  const loaded = useSelector((state: RootState) => !state.currentProject.loading && state.currentProject.data?.id === projectId);
  const saved = useFormSaved();

  useEffect(() => {
    if (!projectId || !loaded) return;
    let cancelled = false;
    fetchProject(projectId)
      .then(data => { if (!cancelled) dispatch(setCurrentProject(data)); })
      .catch(() => { /* the project as last loaded stays */ });
    return () => { cancelled = true; };
  // Once per visit, and after a form opened over it is saved: not again when this refresh itself
  // sets the project.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, dispatch, saved]);
}
