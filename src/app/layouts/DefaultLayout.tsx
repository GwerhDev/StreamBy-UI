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
import { IntegrationsInfoButton } from '../components/IntegrationsInfo/IntegrationsInfoButton';
import { NotificationsInfoButton } from '../components/NotificationsInfo/NotificationsInfoButton';
import { EditorMenuProvider } from '../../context/EditorMenuContext';
import { DesktopProvider, useDesktop } from '../../context/DesktopContext';
import { AppSwitcher } from '../components/AppSwitcher/AppSwitcher';
import { Desktop } from '../components/AppSwitcher/Desktop';
import { ModeToggle } from '../components/ModeToggle/ModeToggle';
import { APP_SWITCHER_URL } from '../../config/api';
import streambyIcon from '../../assets/streamby-icon.svg';

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

  // Moved here from LateralTab's own icon -- the app's own logo/identity belongs in the
  // header (same spot as the other NHEXA apps' brand mark), not the project rail, which is
  // just project navigation.
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
          {/* Left section: the app's own brand icon, in its own inner slot (same fixed
              width as LateralTab's .container -- the rail below) so it sits centered
              directly above the rail, at the start of this outer (1fr) column. */}
          <span className="header-left">
            <span className="streamby-brand-slot">
              <img
                className="streamby-brand-icon"
                onClick={handleGoHome}
                src={streambyIcon}
                alt="StreamBy"
                height={18}
              />
            </span>
          </span>
          {/* Center section: current project name/AppSwitcher, centered on the header's
              real width regardless of how wide header-left/header-right end up being. */}
          <span className="title-container">
            {APP_SWITCHER_URL
              ? <AppSwitcher label={name || 'StreamBy'} projectIcon={image} />
              : (<>{image && <img src={image} alt="" />}<small className="nowrap">{name || 'StreamBy'}</small></>)
            }
          </span>
          {/* Right section: user action icons, at the end of this outer (1fr) column. */}
          <span className="header-right">
            <span className='info-buttons'>
              <ModeToggle />
              <NotificationsInfoButton />
              <IntegrationsInfoButton />
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
