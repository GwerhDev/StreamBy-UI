import s from '../components/LateralMenu/LateralMenu.module.css';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faUsers, faFileExport } from '@fortawesome/free-solid-svg-icons';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';

const RAIL_ITEMS = [
  { icon: faCompass,    path: '/project/explore',         label: 'Projects' },
  { icon: faUsers,      path: '/project/explore/users',   label: 'Users'    },
  { icon: faFileExport, path: '/project/explore/exports', label: 'Exports'  },
];

export const Explore = () => {
  const { pathname } = useLocation();

  return (
    <div className="dashboard-sections">
      <LateralMenu railItems={RAIL_ITEMS}>
        <div className={s.accordionSection}>
          <Link to="/project/explore"         className={`${s.navItem} ${pathname === '/project/explore'         ? s.activeLink : ''}`}>
            <FontAwesomeIcon icon={faCompass}    /> Projects
          </Link>
          <Link to="/project/explore/users"   className={`${s.navItem} ${pathname === '/project/explore/users'   ? s.activeLink : ''}`}>
            <FontAwesomeIcon icon={faUsers}      /> Users
          </Link>
          <Link to="/project/explore/exports" className={`${s.navItem} ${pathname === '/project/explore/exports' ? s.activeLink : ''}`}>
            <FontAwesomeIcon icon={faFileExport} /> Exports
          </Link>
        </div>
      </LateralMenu>
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};
