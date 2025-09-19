import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setProjects, setProjectsLoading } from '../store/projectsSlice';
import { ProjectList } from '../interfaces';
import { fetchProjects } from '../services/projects';

export function useProjects() {
  const dispatch = useDispatch();
  const projectList = useSelector((state: RootState) => state.projects);
  const { logged } = useSelector((state: RootState) => state.session);
  const { databases, loading } = useSelector((state: RootState) => state.management);

  const loadProjects = (projects: ProjectList[]) => {
    dispatch(setProjects(projects));
  };

  const refreshProjects = useCallback(async () => {
    dispatch(setProjectsLoading());
    const newList = await fetchProjects();
    dispatch(setProjects(newList));
  }, [dispatch]);

  useEffect(() => {
    if (logged && !loading && databases && databases.length > 0 && projectList.list.length === 0) {
      refreshProjects();
    }
  }, [logged, loading, databases, refreshProjects]);

  return { projectList, loadProjects, refreshProjects };
}
