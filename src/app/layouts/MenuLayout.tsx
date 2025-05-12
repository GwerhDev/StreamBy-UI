import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { LogoutModal } from '../components/Modals/LogoutModal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { DeleteProjectModal } from '../components/Modals/DeleteProjectModal';
import { useEffect } from 'react';
import { fetchProject } from '../../services/streamby';
import { setCurrentProject } from '../../store/currentProjectSlice';
import { EditProjectModal } from '../components/Modals/EditProjectModal';

export default function MenuLayout() {
  const projects = useSelector((state: RootState) => state.projects);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { id } = useParams() || {};
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchProject(id, navigate);
        dispatch(setCurrentProject(data));
      } catch (err) {
        console.error('Error loading project:', err);
      }
    })();
  }, [id, dispatch, projects]);

  return (
    <>
      <div className="dashboard-sections">
        <LateralMenu />
        <Outlet />
      </div>
      <LogoutModal />
      <EditProjectModal currentProject={currentProject} />
      <DeleteProjectModal currentProject={currentProject} />
    </>
  );
}
