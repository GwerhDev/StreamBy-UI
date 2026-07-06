import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { DeleteProjectModal } from '../components/Modals/DeleteProjectModal';
import { Browser } from '../components/Browser/Browser';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useProjectInit } from '../../hooks/useProjectInit';

export default function ProjectLayout() {
  const currentProject = useSelector((state: RootState) => state.currentProject);

  const { id } = useParams();
  const location = useLocation();
  const { isSmallScreen } = useResponsiveLayout();
  const shouldHideMenu = isSmallScreen && location.pathname !== `/project/${id}`;
  const shouldHideBrowser = !isSmallScreen || location.pathname !== `/project/${id}`;

  useProjectInit(id);

  return (
    <>
      <div className="dashboard-sections">
        {!shouldHideMenu && <LateralMenu />}
        {shouldHideBrowser && (
          <Browser>
            <Outlet />
          </Browser>
        )}
      </div>
      <DeleteProjectModal currentProject={currentProject} />
    </>
  );
}
