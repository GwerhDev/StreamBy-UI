import { Outlet, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '../../store';
import { fetchProjectPreview } from '../../services/projects';
import { Browser } from '../components/Browser/Browser';

export default function PreviewLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const projects = useSelector((state: RootState) => state.projects);

  useEffect(() => {
    if (!projectId || projects.loading) return;
    (async () => {
      try {
        await fetchProjectPreview(projectId);
      } catch (err) {
        console.error('Error loading project preview:', err);
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
