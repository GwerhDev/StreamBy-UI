import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '../../store';
import { useDispatch, useSelector } from 'react-redux';
import { useProjects } from '../../hooks/useProjects';
import { fetchIntegrations } from '../../store/managementSlice';
import { clearCurrentProject } from '../../store/currentProjectSlice';
import { LateralTab } from '../components/LateralTab/LateralTab';
import { LogoutModal } from '../components/Modals/LogoutModal';
import { NotificationsInfoButton } from '../components/NotificationsInfo/NotificationsInfoButton';
import { EditorMenuProvider } from '../../context/EditorMenuContext';
import { DesktopProvider, useDesktop } from '../../context/DesktopContext';
import { AppSwitcher } from '../components/AppSwitcher/AppSwitcher';
import { Desktop } from '../components/AppSwitcher/Desktop';
import { AppTitle } from '../components/AppTitle/AppTitle';
import { APP_SWITCHER_URL } from '../../config/api';

function DefaultLayoutInner() {
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { minimized, setMinimized } = useDesktop();
  const { name, image } = currentProject.data || {};
  const { projectList } = useProjects();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchIntegrations());
  }, [dispatch]);

  // The header's title goes home.
  const handleGoHome = () => {
    dispatch(clearCurrentProject());
    navigate('/');
  };

  return (
    <main>
      {APP_SWITCHER_URL && <Desktop />}
      <div className='app-window'>
        {/* Stays put, only .dashboard-container below minimizes -- same pattern as
            Spellcast-Client/Spectra-Client's header bar. */}
        <div className="header-app">
          {/* Left section: empty, as wide as the right one, so the title stays centered. */}
          <span className="header-left" />
          {/* Center section: the title (the current project, or StreamBy with its mark), which goes home;
              centered on the header's real width regardless of how wide header-left/
              header-right end up being. */}
          <span className="title-container">
            <AppTitle projectName={name} projectImage={image} onClick={handleGoHome} />
          </span>
          {/* Right section: user action icons, at the end of this outer (1fr) column; Nhexa's
              apps open from the last one. */}
          <span className="header-right">
            <span className='info-buttons'>
              <NotificationsInfoButton />
              {APP_SWITCHER_URL && <AppSwitcher />}
            </span>
          </span>
        </div>
        <motion.div
          className='dashboard-container'
          data-minimized={minimized}
          onClick={minimized ? () => setMinimized(false) : undefined}
          animate={minimized
            ? { scale: 0.52, y: '-8%', borderRadius: 16 }
            : { scale: 1, y: 0, borderRadius: 0 }
          }
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          style={{ transformOrigin: 'center' }}
        >
          <LateralTab userData={session} projectList={projectList} />
          <div className="project-viewer">
            <Outlet />
          </div>
          <LogoutModal />
        </motion.div>
      </div>
    </main>
  );
}

export default function DefaultLayout() {
  return (
    <EditorMenuProvider>
      <DesktopProvider>
        <DefaultLayoutInner />
      </DesktopProvider>
    </EditorMenuProvider>
  );
}
