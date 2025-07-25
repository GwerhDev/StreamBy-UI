import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LogoutModal } from '../components/Modals/LogoutModal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { DeleteProjectModal } from '../components/Modals/DeleteProjectModal';
import { useEffect, useState } from 'react';
import { fetchProject } from '../../services/streamby';
import { setCurrentProject, setProjectLoading } from '../../store/currentProjectSlice';
import { Browser } from '../components/Browser/Browser';

export default function ProjectLayout() {
  const currentProject = useSelector((state: RootState) => state.currentProject);

  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);
  const shouldHideMenu = isSmallScreen && location.pathname !== `/project/${id}`;
  const shouldHideBrowser = !isSmallScreen || location.pathname !== `/project/${id}`;

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        dispatch(setProjectLoading());
        const data = await fetchProject(id, navigate);
        dispatch(setCurrentProject(data));

      } catch (err) {
        console.error('Error loading project:', err);
      }
    })();
  }, [id, dispatch, navigate]);

  return (
    <>
      <div className="dashboard-sections">
        {!shouldHideMenu && <LateralMenu />}
        {
          shouldHideBrowser &&
          <Browser>
            <Outlet />
          </Browser >
        }
      </div >
      <LogoutModal />
      <DeleteProjectModal currentProject={currentProject.data} />
    </>
  );
}
