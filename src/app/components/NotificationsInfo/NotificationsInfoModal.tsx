import s from './NotificationsInfo.module.css';
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckDouble, faCircleCheck, faTriangleExclamation,
  faCircleXmark, faCircleInfo, faCheck, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { ServerNotification } from '../../../store/notificationsSlice';
import { RootState } from '../../../store';
import { acceptInvitation, rejectInvitation } from '../../../services/members';

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

interface NotificationsInfoModalProps {
  notifications: ServerNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationsInfoModal: React.FC<NotificationsInfoModalProps> = ({
  notifications, onClose, onMarkAllRead, onMarkRead,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.session.userId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleItemClick = (n: ServerNotification) => {
    onMarkRead(n._id);
    if (n.callback) {
      try {
        const url = new URL(n.callback);
        if (url.origin === window.location.origin) {
          navigate(url.pathname + url.search + url.hash);
        } else {
          window.open(n.callback, '_blank', 'noopener,noreferrer');
        }
      } catch {
        navigate(n.callback);
      }
    } else {
      navigate('/user/notification/' + n._id);
    }
    onClose();
  };

  const handleAcceptInvite = async (e: React.MouseEvent, n: ServerNotification) => {
    e.stopPropagation();
    if (!n.data?.projectId || !userId) return;
    onMarkRead(n._id);
    await acceptInvitation(n.data.projectId, userId);
  };

  const handleRejectInvite = async (e: React.MouseEvent, n: ServerNotification) => {
    e.stopPropagation();
    if (!n.data?.projectId || !userId) return;
    onMarkRead(n._id);
    await rejectInvitation(n.data.projectId, userId);
  };

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
          {notifications.map(n => {
            const displayType = getDisplayType(n.type);
            const isInvite = n.type === 'member_invited';
            return (
              <li
                key={n._id}
                className={`${s.item} ${!n.read ? s.itemUnread : ''}`}
                onClick={() => !isInvite && handleItemClick(n)}
              >
                <FontAwesomeIcon
                  icon={TYPE_ICON[displayType]}
                  className={`${s.typeIcon} ${s[`type_${displayType}`]}`}
                />
                <div className={s.itemBody}>
                  <div className={s.itemTop}>
                    <span className={s.itemTitle}>{getTitle(n.type)}</span>
                    <span className={s.itemTime}>{formatTime(n.createdAt)}</span>
                  </div>
                  <p className={s.itemMessage}>{n.message}</p>
                  {isInvite && (
                    <div className={s.inviteActions}>
                      <button
                        type="button"
                        className={s.inviteAcceptBtn}
                        onClick={e => handleAcceptInvite(e, n)}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        Accept
                      </button>
                      <button
                        type="button"
                        className={s.inviteRejectBtn}
                        onClick={e => handleRejectInvite(e, n)}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
                {!n.read && <span className={s.unreadDot} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
