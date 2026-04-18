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
    fetchProjectPreview(projectId);
  }, [projectId, projects.loading]);

  return (
    <div className="dashboard-sections">
      <Browser preview >
        <Outlet />
      </Browser>
    </div>
  )
}
