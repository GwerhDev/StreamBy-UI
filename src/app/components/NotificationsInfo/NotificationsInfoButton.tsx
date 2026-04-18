import s from './NotificationsInfo.module.css';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { markNotificationRead, markAllNotificationsRead } from '../../../services/notifications';
import { NotificationsInfoModal } from './NotificationsInfoModal';

export const NotificationsInfoButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useSelector((state: RootState) => state.notifications.items);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={s.container}>
      <button
        type="button"
        className={s.notifButton}
        title="Notifications"
        onClick={() => setIsOpen(v => !v)}
      >
        <FontAwesomeIcon icon={faBell} className={s.icon} />
        {unreadCount > 0 && (
          <span className={s.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      {isOpen && (
        <NotificationsInfoModal
          notifications={notifications}
          onClose={() => setIsOpen(false)}
          onMarkAllRead={markAllNotificationsRead}
          onMarkRead={markNotificationRead}
        />
      )}
    </div>
  );
};
