import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faPalette, faBell, faCode, faShield, faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import lm from '../components/LateralMenu/LateralMenu.module.css';

const CATEGORIES = [
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

  return (
    <div className="dashboard-sections">
      <LateralMenu>
        <span className={lm.section}>
          <h4>SETTINGS</h4>
        </span>
        <ul className={lm.menuList}>
          {CATEGORIES.map(cat => (
            <Link key={cat.id} to={`/user/settings?tab=${cat.id}`}>
              <li className={activeTab === cat.id && pathname === '/user/settings' ? lm.activeLink : ''}>
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
