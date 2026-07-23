import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setProjects, setProjectsLoading, setProjectsError } from '../store/projectsSlice';
import { fetchProjects } from '../services/projects';

export function useProjects() {
  const dispatch = useDispatch<AppDispatch>();
  const projectList = useSelector((state: RootState) => state.projects);
  const { logged } = useSelector((state: RootState) => state.session);

  const refreshProjects = useCallback(async () => {
    dispatch(setProjectsLoading());
    try {
      const newList = await fetchProjects();
      dispatch(setProjects(newList));
    } catch (err) {
      dispatch(setProjectsError(err instanceof Error ? err.message : 'Failed to load projects'));
    }
  }, [dispatch]);

  useEffect(() => {
    if (logged && projectList.list.length === 0) {
      refreshProjects();
    }
    //eslint-disable-next-line
  }, [logged, refreshProjects]);

  return { projectList, refreshProjects };
}
