import s from '../LateralMenu/LateralMenu.module.css';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck, faCircleInfo, faCircleXmark, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { markNotificationRead } from '../../../services/notifications';
import { ServerNotification } from '../../../store/notificationsSlice';

const MENU_MIN_WIDTH = 160;
const MENU_MAX_WIDTH = 480;
const MENU_DEFAULT_WIDTH = 250;

type DisplayType = 'success' | 'warning' | 'error' | 'info';

const TYPE_ICON = {
  success: faCircleCheck,
  warning: faTriangleExclamation,
  error: faCircleXmark,
  info: faCircleInfo,
};

function getDisplayType(type: string): DisplayType {
  if (/error|fail|failed|denied/.test(type)) return 'error';
  if (/warn|warning|slow|limit/.test(type)) return 'warning';
  if (/success|complete|done|added|created|uploaded|joined/.test(type)) return 'success';
  return 'info';
}

function getTitle(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const NotificationMenu = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const notifications = useSelector((state: RootState) => state.notifications.items);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);
  const [menuWidth, setMenuWidth] = useLocalStorage<number>('streamby-notif-menu-width', MENU_DEFAULT_WIDTH);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = menuWidth;

    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.min(Math.max(startWidth + ev.clientX - startX, MENU_MIN_WIDTH), MENU_MAX_WIDTH);
      setMenuWidth(newWidth);
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleClick = (n: ServerNotification) => {
    markNotificationRead(n._id);
    navigate(`/user/notification/${n._id}`);
  };

  return (
    <div className={s.wrapper} style={{ width: `${menuWidth}px` }}>
      <div className={s.container}>
        <div className={s.titleButton}>
          <span className={s.title} style={{ cursor: 'default' }}>
            <h4>Notifications</h4>
          </span>
        </div>
        <div className={s.outterMenuContainer}>
          <div className={s.menuContainer}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-light-400)', textAlign: 'center', marginTop: '1rem' }}>
                No notifications
              </p>
            ) : (
              <ul className={s.menuList}>
                {notifications.map(n => {
                  const displayType = getDisplayType(n.type);
                  const isActive = n._id === id;
                  return (
                    <li
                      key={n._id}
                      className={isActive ? s.activeLink : ''}
                      onClick={() => handleClick(n)}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem', opacity: n.read ? 0.65 : 1 }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                        <FontAwesomeIcon
                          icon={TYPE_ICON[displayType]}
                          style={{ fontSize: '0.75rem', flexShrink: 0, color: displayType === 'success' ? '#4ade80' : displayType === 'warning' ? '#facc15' : displayType === 'error' ? '#f87171' : '#60a5fa' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getTitle(n.type)}
                        </span>
                        {!n.read && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                        )}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-light-400)', paddingLeft: '1.25rem' }}>
                        {formatTime(n.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      {!isSmallScreen && <div className={s.resizeHandle} onMouseDown={handleResizeMouseDown} />}
    </div>
  );
};
