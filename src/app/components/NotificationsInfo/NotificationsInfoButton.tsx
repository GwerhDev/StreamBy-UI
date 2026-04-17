import s from './NotificationsInfo.module.css';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { NotificationsInfoModal, Notification } from './NotificationsInfoModal';

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Export completed',
    message: 'Portfolio API export has been processed successfully.',
    type: 'success',
    read: false,
    timestamp: '2m ago',
  },
  {
    id: '2',
    title: 'Connection warning',
    message: 'Database response time is higher than usual.',
    type: 'warning',
    read: false,
    timestamp: '15m ago',
  },
  {
    id: '3',
    title: 'New member joined',
    message: 'user@example.com joined the Spellcast project.',
    type: 'info',
    read: false,
    timestamp: '2h ago',
  },
  {
    id: '4',
    title: 'Export failed',
    message: 'NHEXA Interface export failed due to a connection error.',
    type: 'error',
    read: true,
    timestamp: '1d ago',
  },
];

export const NotificationsInfoButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleMarkRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

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
          <span className={s.badge}></span>
        )}
      </button>
      {isOpen && (
        <NotificationsInfoModal
          notifications={notifications}
          onClose={() => setIsOpen(false)}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
        />
      )}
    </div>
  );
};
