import { Outlet, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState, AppDispatch } from '../../store';
import { fetchProjectPreview } from '../../services/projects';
import { setCurrentProject, setMembership } from '../../store/currentProjectSlice';
import { addApiResponse } from '../../store/apiResponsesSlice';
import { Browser } from '../components/Browser/Browser';

export default function PreviewLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const projects = useSelector((state: RootState) => state.projects);

  useEffect(() => {
    if (!projectId || projects.loading) return;
    let cancelled = false;
    (async () => {
      try {
        const { project, membership } = await fetchProjectPreview(projectId);
        // Guard against a stale response landing after the user has already navigated
        // away (e.g. hit "back" before this resolved) — it would otherwise overwrite
        // the real project data with this preview's reduced shape.
        if (cancelled) return;
        dispatch(setCurrentProject(project));
        dispatch(setMembership(membership));
      } catch (err: any) {
        if (!cancelled) dispatch(addApiResponse({ message: err.message || 'Failed to load project preview.', type: 'error' }));
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, projects.loading]);

  return (
    <div className="dashboard-sections">
      <Browser preview >
        <Outlet />
      </Browser>
    </div>
  )
}
