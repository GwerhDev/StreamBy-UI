import { Link, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useEditorMenu } from '../../context/EditorMenuContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRocket, faBoxOpen, faFileExport, faPlug,
  faBook, faCode, faClockRotateLeft, faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import lm from '../components/LateralMenu/LateralMenu.module.css';
import s from './HomeLayout.module.css';

const GETTING_STARTED = [
  { icon: faRocket,     label: 'Create a project',          to: '/project/create', soon: false },
  { icon: faBoxOpen,    label: 'Upload your first asset',   to: null,              soon: true  },
  { icon: faFileExport, label: 'Create your first export',  to: null,              soon: true  },
  { icon: faPlug,       label: 'Connect an API',            to: null,              soon: true  },
];

const RESOURCES = [
  { icon: faBook,              label: 'Documentation',  to: null, soon: true },
  { icon: faCode,              label: 'API Reference',  to: null, soon: true },
  { icon: faClockRotateLeft,   label: 'Changelog',      to: null, soon: true },
  { icon: faUsers,             label: 'Community',      to: null, soon: true },
];

export default function HomeLayout() {
  const { closeMenu } = useEditorMenu();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { closeMenu(); }, []);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <LateralMenu>

        <span className={lm.section}>
          <h4>GETTING STARTED</h4>
        </span>
        <ul className={lm.menuList}>
          {GETTING_STARTED.map(item => (
            <li key={item.label}>
              {item.to ? (
                <Link to={item.to} className={s.itemRow}>
                  <FontAwesomeIcon icon={item.icon} />
                  {item.label}
                </Link>
              ) : (
                <span className={s.itemRow}>
                  <FontAwesomeIcon icon={item.icon} />
                  {item.label}
                  <span className={s.soon}>Soon</span>
                </span>
              )}
            </li>
          ))}
        </ul>

        <span className={`${lm.section} ${s.sectionGap}`}>
          <h4>RESOURCES</h4>
        </span>
        <ul className={lm.menuList}>
          {RESOURCES.map(item => (
            <li key={item.label}>
              <span className={`${s.itemRow} ${s.itemDisabled}`}>
                <FontAwesomeIcon icon={item.icon} />
                {item.label}
                <span className={s.soon}>Soon</span>
              </span>
            </li>
          ))}
        </ul>

      </LateralMenu>
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
