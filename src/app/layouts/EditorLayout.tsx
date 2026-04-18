import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { useEffect } from 'react';
import { fetchProject } from '../../services/projects';
import { setCurrentProject, setProjectLoading } from '../../store/currentProjectSlice';

export default function EditorLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const projects = useSelector((state: RootState) => state.projects);
  const session = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!projectId || projects.loading) return;
    (async () => {
      try {
        dispatch(setProjectLoading());
        const data = await fetchProject(projectId, navigate);
        dispatch(setCurrentProject(data));
      } catch (err) {
        console.error('Error loading project:', err);
      }
    })();
    //eslint-disable-next-line
  }, [projectId, projects.loading, session.userId]);

  return (
    <div className="dashboard-sections">
      <LateralMenu />
      <Outlet />
    </div>
  );
}
