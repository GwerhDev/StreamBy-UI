import { useDispatch, useSelector } from 'react-redux';
import { setProjects } from '../store/projectsSlice';
import { RootState } from '../store';
import { fetchProjects } from '../services/streamby';

export function useProjects() {
  const dispatch = useDispatch();
  const projectList = useSelector((state: RootState) => state.projects.list);

  const loadProjects = (projects: any[]) => {
    dispatch(setProjects(projects));
  };

  const refreshProjects = async () => {
    const newList = await fetchProjects();
    dispatch(setProjects(newList));
  };
  return { projectList, loadProjects, refreshProjects };
}
