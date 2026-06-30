import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchProject } from '../services/projects';
import { setCurrentProject, setProjectLoading } from '../store/currentProjectSlice';

export function useProjectInit(projectId: string | undefined) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const projects = useSelector((state: RootState) => state.projects);
  const session = useSelector((state: RootState) => state.session);

  useEffect(() => {
    if (!projectId || projects.loading) return;
    (async () => {
      try {
        dispatch(setProjectLoading());
        const data = await fetchProject(projectId, navigate);
        dispatch(setCurrentProject(data));
      } catch {
        // fetchProject already navigates to /project/not-found on failure
      }
    })();
  }, [projectId, projects.loading, session.userId]);
}
