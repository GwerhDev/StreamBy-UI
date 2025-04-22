import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProject } from '../../services/streamby';
import { clearCurrentProject, setCurrentProject } from '../../store/currentProjectSlice';
import { RootState } from '../../store';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { Browser } from '../components/Browser/Browser';
import { DeleteProjectModal } from '../components/Modals/DeleteProjectModal';

export const Project = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        dispatch(clearCurrentProject());
        const data = await fetchProject(id);
        dispatch(setCurrentProject(data));
      } catch (err) {
        console.error('Error loading project:', err);
      }
    })();
  }, [id, dispatch]);

  return (
    <div className="dashboard-sections">
      <LateralMenu />
      <Browser />
      <DeleteProjectModal currentProject={currentProject} />
    </div>
  );
};
