import { Outlet } from 'react-router-dom';
import { LogoutModal } from '../components/Modals/LogoutModal';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { DeleteProjectModal } from '../components/Modals/DeleteProjectModal';

export default function ProjectLayout() {
  const currentProject = useSelector((state: RootState) => state.currentProject);

  return (
    <>
      <div className="dashboard-sections">
        <LateralMenu />
        <Outlet />
      </div>
      <LogoutModal />
      <DeleteProjectModal currentProject={currentProject} />
    </>
  );
}
