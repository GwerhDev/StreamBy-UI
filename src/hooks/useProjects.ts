import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../services/streamby';
import { RootState } from '../store';
import { setProjects } from '../store/projectsSlice';
import { ProjectList } from '../interfaces';
import { useEffect } from 'react';

export function useProjects() {
  const dispatch = useDispatch();
  const projectList = useSelector((state: RootState) => state.projects);
  const { logged } = useSelector((state: RootState) => state.session);
  const { databases, loading } = useSelector((state: RootState) => state.management);

  const loadProjects = (projects: ProjectList[]) => {
    dispatch(setProjects(projects));
  };

  const refreshProjects = async () => {
    const newList = await fetchProjects();
    dispatch(setProjects(newList));
  };

  useEffect(() => {
    if (logged && !loading && databases.length > 0) {
      refreshProjects();
    }
  }, [logged, loading, databases.length]);

  return { projectList, loadProjects, refreshProjects };
}
