import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setProjects, setProjectsLoading } from '../store/projectsSlice';
import { fetchProjects } from '../services/projects';

export function useProjects() {
  const dispatch = useDispatch<AppDispatch>();
  const projectList = useSelector((state: RootState) => state.projects);
  const { logged } = useSelector((state: RootState) => state.session);
  const { databases, loading } = useSelector((state: RootState) => state.management);

  const refreshProjects = useCallback(async () => {
    dispatch(setProjectsLoading());
    try {
      const newList = await fetchProjects();
      dispatch(setProjects(newList));
    } catch {
      dispatch(setProjectsLoading());
    }
  }, [dispatch]);

  useEffect(() => {
    if (logged && !loading && databases && databases.length > 0 && projectList.list.length === 0) {
      refreshProjects();
    }
    //eslint-disable-next-line
  }, [logged, loading, databases, refreshProjects]);

  return { projectList, refreshProjects };
}
