import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '../../store';
import { useDispatch, useSelector } from 'react-redux';
import { useProjects } from '../../hooks/useProjects';
import { fetchDatabases, fetchStorages } from '../../store/managementSlice';
import { fetchNotifications } from '../../store/notificationsSlice';
import { LateralTab } from '../components/LateralTab/LateralTab';
import { LogoutModal } from '../components/Modals/LogoutModal';
import { IntegrationsInfoButton } from '../components/IntegrationsInfo/IntegrationsInfoButton';
import { NotificationsInfoButton } from '../components/NotificationsInfo/NotificationsInfoButton';
import { EditorMenuProvider } from '../../context/EditorMenuContext';
import { AppSwitcher } from '../components/AppSwitcher/AppSwitcher';
import { Desktop } from '../components/AppSwitcher/Desktop';
import { APP_SWITCHER_URL } from '../../config/api';
import { setMinimized } from '../../store/desktopSlice';

export default function DefaultLayout() {
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const minimized = useSelector((state: RootState) => state.desktop.minimized);
  const { name, image } = currentProject.data || {};
  const { projectList } = useProjects();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchDatabases());
    dispatch(fetchStorages());
    dispatch(fetchNotifications());
  }, [dispatch]);

  return (
    <EditorMenuProvider>
      <main>
        {APP_SWITCHER_URL && <Desktop />}
        <motion.div
          className='app-window'
          onClick={minimized ? () => dispatch(setMinimized(false)) : undefined}
          animate={minimized
            ? { scale: 0.52, y: '-8%', borderRadius: 16 }
            : { scale: 1, y: 0, borderRadius: 0 }
          }
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          style={{ transformOrigin: 'center' }}
        >
          <div className='dashboard-container'>
            <LateralTab userData={session} projectList={projectList} />
            <div className="project-viewer">
              <div className="header-app">
                <span className="title-container">
                  {APP_SWITCHER_URL
                    ? <AppSwitcher label={name || 'StreamBy'} projectIcon={image} />
                    : (<>{image && <img src={image} alt="" />}<small className="font-bold nowrap">{name || 'StreamBy'}</small></>)
                  }
                </span>
                <span className='info-buttons'>
                  <NotificationsInfoButton />
                  <IntegrationsInfoButton />
                </span>
              </div>
              <Outlet />
            </div>
          </div>
          <LogoutModal />
        </motion.div>
      </main>
    </EditorMenuProvider>
  );
}
