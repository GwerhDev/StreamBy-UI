import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRocket, faBoxOpen, faFileExport, faPlug,
  faBook, faCode, faClockRotateLeft, faUsers, faCompass,
} from '@fortawesome/free-solid-svg-icons';
import { LateralMenu } from './LateralMenu';
import s from './HomeMenu.module.css';

const GETTING_STARTED = [
  { icon: faRocket,     label: 'Create a project',         to: '/project/create', soon: false },
  { icon: faCompass,    label: 'Explore projects',         to: '/project/explore', soon: false },
  { icon: faBoxOpen,    label: 'Upload your first asset',  to: null,              soon: true  },
  { icon: faFileExport, label: 'Create your first export', to: null,              soon: true  },
  { icon: faPlug,       label: 'Connect an API',           to: null,              soon: true  },
];

const RESOURCES = [
  { icon: faBook,            label: 'Documentation', to: null, soon: true },
  { icon: faCode,            label: 'API Reference',  to: null, soon: true },
  { icon: faClockRotateLeft, label: 'Changelog',      to: null, soon: true },
  { icon: faUsers,           label: 'Community',      to: null, soon: true },
];

export const HomeMenu = () => {
  const { pathname } = useLocation();

  return (
  <LateralMenu>
    <span className={s.section}><h4>GETTING STARTED</h4></span>
    <ul className={s.menuList}>
      {GETTING_STARTED.map(item => (
        item.to ? (
          <Link key={item.label} to={item.to}>
            <li className={pathname === item.to ? s.activeLink : ''}>
              <FontAwesomeIcon icon={item.icon} />
              {item.label}
            </li>
          </Link>
        ) : (
          <li key={item.label} className={s.disabled}>
            <FontAwesomeIcon icon={item.icon} />
            {item.label}
            <span className={s.soon}>Soon</span>
          </li>
        )
      ))}
    </ul>

    <span className={`${s.section} ${s.sectionGap}`}><h4>RESOURCES</h4></span>
    <ul className={s.menuList}>
      {RESOURCES.map(item => (
        <li key={item.label} className={s.disabled}>
          <FontAwesomeIcon icon={item.icon} />
          {item.label}
          <span className={s.soon}>Soon</span>
        </li>
      ))}
    </ul>
  </LateralMenu>
  );
};
