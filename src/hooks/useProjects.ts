import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../services/streamby';
import { RootState } from '../store';
import { setProjects } from '../store/projectsSlice';
import { setArchivedProjects } from '../store/archivedProjectsSlice';
import { Project } from '../interfaces';

export function useProjects() {
  const dispatch = useDispatch();
  const projectList = useSelector((state: RootState) => state.projects);

  const loadProjects = (projects: Project[]) => {
    dispatch(setProjects(projects));
  };

  const loadArchivedProjects = (projects: Project[]) => {
    dispatch(setArchivedProjects(projects));
  };

  const refreshProjects = async () => {
    const newList = await fetchProjects();
    dispatch(setProjects(newList));
  };

  return { projectList, loadProjects, loadArchivedProjects, refreshProjects };
}
