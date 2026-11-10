import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { reloadProjects } from '../store/projectsSlice';

export function useProjects() {
  const dispatch = useDispatch<AppDispatch>();
  const projectList = useSelector((state: RootState) => state.projects);
  const { logged } = useSelector((state: RootState) => state.session);

  const refreshProjects = useCallback(() => dispatch(reloadProjects()), [dispatch]);

  useEffect(() => {
    if (logged && projectList.list.length === 0) {
      refreshProjects();
    }
    //eslint-disable-next-line
  }, [logged, refreshProjects]);

  return { projectList, refreshProjects };
}
