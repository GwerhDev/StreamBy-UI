import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { DeleteProjectModal } from '../components/Modals/DeleteProjectModal';
import { useEffect } from 'react';
import { fetchProject } from '../../services/projects';
import { setCurrentProject, setProjectLoading } from '../../store/currentProjectSlice';
import { Browser } from '../components/Browser/Browser';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

export default function ProjectLayout() {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const session = useSelector((state: RootState) => state.session);

  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSmallScreen } = useResponsiveLayout();
  const shouldHideMenu = isSmallScreen && location.pathname !== `/project/${id}`;
  const shouldHideBrowser = !isSmallScreen || location.pathname !== `/project/${id}`;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        dispatch(setProjectLoading());
        const data = await fetchProject(id, navigate);
        dispatch(setCurrentProject(data));

        const selfMember = data?.members?.find((m: { userId: string }) => m.userId === session.userId);
        if (selfMember?.status === 'pending') {
          navigate(`/preview/${id}`, { replace: true });
        }
      } catch (err) {
        console.error('Error loading project:', err);
      }
    })();
  }, [id]);

  return (
    <>
      <div className="dashboard-sections">
        {!shouldHideMenu && <LateralMenu />}
        {
          shouldHideBrowser &&
          <Browser>
            <Outlet />
          </Browser>
        }
      </div>
      <DeleteProjectModal currentProject={currentProject} />
    </>
  );
}
