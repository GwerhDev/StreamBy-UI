import s from './NotificationsInfo.module.css';
import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckDouble, faCircleCheck, faTriangleExclamation,
  faCircleXmark, faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
}

interface NotificationsInfoModalProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

const TYPE_ICON = {
  success: faCircleCheck,
  warning: faTriangleExclamation,
  error:   faCircleXmark,
  info:    faCircleInfo,
};

export const NotificationsInfoModal: React.FC<NotificationsInfoModalProps> = ({
  notifications, onClose, onMarkAllRead, onMarkRead,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={s.modal} ref={modalRef}>
      <div className={s.modalHeader}>
        <span className={s.modalTitle}>Notifications</span>
        {unreadCount > 0 && (
          <button type="button" className={s.markAllBtn} onClick={onMarkAllRead}>
            <FontAwesomeIcon icon={faCheckDouble} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={s.emptyState}>
          <FontAwesomeIcon icon={faCircleCheck} className={s.emptyIcon} />
          <p className={s.emptyText}>You're all caught up!</p>
        </div>
      ) : (
        <ul className={s.list}>
          {notifications.map(n => (
            <li
              key={n.id}
              className={`${s.item} ${!n.read ? s.itemUnread : ''}`}
              onClick={() => onMarkRead(n.id)}
            >
              <FontAwesomeIcon icon={TYPE_ICON[n.type]} className={`${s.typeIcon} ${s[`type_${n.type}`]}`} />
              <div className={s.itemBody}>
                <div className={s.itemTop}>
                  <span className={s.itemTitle}>{n.title}</span>
                  <span className={s.itemTime}>{n.timestamp}</span>
                </div>
                <p className={s.itemMessage}>{n.message}</p>
              </div>
              {!n.read && <span className={s.unreadDot} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
