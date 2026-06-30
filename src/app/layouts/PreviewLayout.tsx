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
    (async () => {
      try {
        const { project, membership } = await fetchProjectPreview(projectId);
        dispatch(setCurrentProject(project));
        dispatch(setMembership(membership));
      } catch (err: any) {
        dispatch(addApiResponse({ message: err.message || 'Failed to load project preview.', type: 'error' }));
      }
    })();
  }, [projectId, projects.loading]);

  return (
    <div className="dashboard-sections">
      <Browser preview >
        <Outlet />
      </Browser>
    </div>
  )
}
