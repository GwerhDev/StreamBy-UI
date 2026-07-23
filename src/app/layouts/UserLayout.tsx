import s from '../components/LateralMenu/LateralMenu.module.css';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faIdCard, faPalette, faBell, faCode, faShield, faCreditCard, faArchive,
  faUser, faChevronDown, faGear, faPlug,
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { clearCurrentProject } from '../../store/currentProjectSlice';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';

const SETTINGS_CATEGORIES = [
  { id: 'account',       label: 'Account',       icon: faUser       },
  { id: 'appearance',    label: 'Appearance',     icon: faPalette    },
  { id: 'notifications', label: 'Notifications',  icon: faBell       },
  { id: 'editor',        label: 'Editor',         icon: faCode       },
  { id: 'security',      label: 'Security',       icon: faShield     },
  { id: 'billing',       label: 'Plan & Billing', icon: faCreditCard },
];

const RAIL_ITEMS = [
  { icon: faIdCard, path: '/user',          label: 'User'     },
  { icon: faGear,   path: '/user/settings', label: 'Settings' },
];

export default function UserLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const session = useSelector((state: RootState) => state.session);
  const activeTab = searchParams.get('tab') ?? 'account';
  const isUserRoute = pathname === '/user';
  const isProfileRoute = pathname === '/user/profile';
  const isArchiveRoute = pathname === '/user/archive';
  const isIntegrationsRoute = pathname.startsWith('/user/integrations');
  const isSettingsRoute = pathname === '/user/settings';
  const [userOpen, setUserOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  useEffect(() => {
    dispatch(clearCurrentProject());
  }, [dispatch]);

  return (
    <div className="dashboard-sections">
      <LateralMenu title={session.username || 'User'} railItems={RAIL_ITEMS}>

        <div className={s.accordionSection}>
          <div
            className={`${s.sectionHeader} ${isUserRoute || isProfileRoute || isArchiveRoute || isIntegrationsRoute ? s.sectionHeaderActive : ''}`}
            onClick={() => setUserOpen(v => !v)}
          >
            <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate('/user'); }}>User</span>
            <div className={`${s.sectionChevronWrap} ${userOpen ? s.sectionChevronWrapOpen : ''}`}>
              <FontAwesomeIcon icon={faIdCard} className={s.sectionChevronSectionIcon} />
              <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
            </div>
          </div>
          {userOpen && (
            <div className={s.sectionBody}>
              <Link
                to="/user/profile"
                className={`${s.navItem} ${isProfileRoute ? s.activeLink : ''}`}
              >
                <FontAwesomeIcon icon={faIdCard} />
                Profile
              </Link>
              <Link
                to="/user/archive"
                className={`${s.navItem} ${isArchiveRoute ? s.activeLink : ''}`}
              >
                <FontAwesomeIcon icon={faArchive} />
                Archive
              </Link>
              <Link
                to="/user/integrations"
                className={`${s.navItem} ${isIntegrationsRoute ? s.activeLink : ''}`}
              >
                <FontAwesomeIcon icon={faPlug} />
                Integrations
              </Link>
            </div>
          )}
        </div>

        <div className={s.accordionSection}>
          <div
            className={`${s.sectionHeader} ${isSettingsRoute ? s.sectionHeaderActive : ''}`}
            onClick={() => setSettingsOpen(v => !v)}
          >
            <span className={s.sectionLabel} onClick={e => { e.stopPropagation(); navigate('/user/settings'); }}>Settings</span>
            <div className={`${s.sectionChevronWrap} ${settingsOpen ? s.sectionChevronWrapOpen : ''}`}>
              <FontAwesomeIcon icon={faGear} className={s.sectionChevronSectionIcon} />
              <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
            </div>
          </div>
          {settingsOpen && (
            <div className={s.sectionBody}>
              {SETTINGS_CATEGORIES.map(cat => (
                <Link
                  key={cat.id}
                  to={`/user/settings?tab=${cat.id}`}
                  className={`${s.navItem} ${isSettingsRoute && activeTab === cat.id ? s.activeLink : ''}`}
                >
                  <FontAwesomeIcon icon={cat.icon} />
                  {cat.label}
                </Link>
              ))}
            </div>
          )}
        </div>

      </LateralMenu>

      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
