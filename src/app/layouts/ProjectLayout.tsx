import { useEffect } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchDatabases, fetchStorages } from '../../store/managementSlice';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { DeleteProjectModal } from '../components/Modals/DeleteProjectModal';
import { Browser } from '../components/Browser/Browser';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useProjectInit } from '../../hooks/useProjectInit';

export default function ProjectLayout() {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const dispatch = useDispatch<AppDispatch>();

  const { id } = useParams();
  const location = useLocation();
  const { isSmallScreen } = useResponsiveLayout();
  const shouldHideMenu = isSmallScreen && location.pathname !== `/project/${id}`;
  const shouldHideBrowser = !isSmallScreen || location.pathname !== `/project/${id}`;

  useProjectInit(id);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchDatabases());
    dispatch(fetchStorages());
  }, [id, dispatch]);

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
