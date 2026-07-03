import s from '../components/LateralMenu/LateralMenu.module.css';
import { useState } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faIdCard, faPalette, faBell, faCode, faShield, faCreditCard, faArchive,
  faUser, faChevronDown, faGear,
} from '@fortawesome/free-solid-svg-icons';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';

const SETTINGS_CATEGORIES = [
  { id: 'account',       label: 'Account',       icon: faUser       },
  { id: 'appearance',    label: 'Appearance',     icon: faPalette    },
  { id: 'notifications', label: 'Notifications',  icon: faBell       },
  { id: 'editor',        label: 'Editor',         icon: faCode       },
  { id: 'security',      label: 'Security',       icon: faShield     },
  { id: 'billing',       label: 'Plan & Billing', icon: faCreditCard },
];

export default function UserLayout() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'account';
  const isSettingsRoute = pathname === '/user/settings';
  const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute);

  return (
    <div className="dashboard-sections">
      <LateralMenu>
        <Link
          to="/user/profile"
          className={`${s.navItem} ${pathname === '/user/profile' ? s.activeLink : ''}`}
        >
          <FontAwesomeIcon icon={faIdCard} />
          Profile
        </Link>
        <Link
          to="/user/archive"
          className={`${s.navItem} ${pathname === '/user/archive' ? s.activeLink : ''}`}
        >
          <FontAwesomeIcon icon={faArchive} />
          Archive
        </Link>

        <div className={s.accordionSection}>
          <div
            className={`${s.sectionHeader} ${isSettingsRoute ? s.sectionHeaderActive : ''}`}
            onClick={() => setSettingsOpen(v => !v)}
          >
            <span className={s.sectionLabel}>Settings</span>
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
