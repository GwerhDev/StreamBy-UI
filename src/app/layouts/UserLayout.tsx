import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faPalette, faBell, faCode, faShield, faCreditCard, faArchive,
} from '@fortawesome/free-solid-svg-icons';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import lm from '../components/LateralMenu/LateralMenu.module.css';

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

  return (
    <div className="dashboard-sections">
      <LateralMenu>
        <span className={lm.section}>
          <h4>USER</h4>
        </span>
        <ul className={lm.menuList}>
          <Link to="/user/profile">
            <li className={pathname === '/user/profile' ? lm.activeLink : ''}>
              <FontAwesomeIcon icon={faUser} />
              Profile
            </li>
          </Link>
          <Link to="/user/archive">
            <li className={pathname === '/user/archive' ? lm.activeLink : ''}>
              <FontAwesomeIcon icon={faArchive} />
              Archive
            </li>
          </Link>
        </ul>
        <span className={lm.section}>
          <h4>SETTINGS</h4>
        </span>
        <ul className={lm.menuList}>
          {SETTINGS_CATEGORIES.map(cat => (
            <Link key={cat.id} to={`/user/settings?tab=${cat.id}`}>
              <li className={isSettingsRoute && activeTab === cat.id ? lm.activeLink : ''}>
                <FontAwesomeIcon icon={cat.icon} />
                {cat.label}
              </li>
            </Link>
          ))}
        </ul>
      </LateralMenu>
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
