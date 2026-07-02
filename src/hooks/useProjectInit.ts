import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchProject } from '../services/projects';
import { setCurrentProject, setProjectLoading } from '../store/currentProjectSlice';

export function useProjectInit(projectId: string | undefined) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const session = useSelector((state: RootState) => state.session);

  useEffect(() => {
    if (!projectId) {
      navigate('/project/not-found');
      return;
    }
    (async () => {
      try {
        dispatch(setProjectLoading());
        const data = await fetchProject(projectId);
        dispatch(setCurrentProject(data));

        const selfMember = data?.members?.find((m: { userId: string }) => m.userId === session.userId);
        if (selfMember?.status === 'pending') {
          navigate(`/preview/${projectId}`, { replace: true });
        }
      } catch {
        navigate('/project/not-found');
      }
    })();
  }, [projectId, session.userId, dispatch, navigate]);
}
