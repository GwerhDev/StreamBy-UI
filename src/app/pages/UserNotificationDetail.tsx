import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck, faCircleInfo, faCircleXmark, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchNotificationById } from '../../store/currentNotificationSlice';
import { MemberInvitedTemplate } from '../components/Notifications/MemberInvitedTemplate';

type DisplayType = 'success' | 'warning' | 'error' | 'info';

const TYPE_ICON = {
  success: faCircleCheck,
  warning: faTriangleExclamation,
  error: faCircleXmark,
  info: faCircleInfo,
};

const TYPE_COLOR = {
  success: '#4ade80',
  warning: '#facc15',
  error: '#f87171',
  info: '#60a5fa',
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

export const UserNotificationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.currentNotification);

  useEffect(() => {
    if (id) dispatch(fetchNotificationById(id));
  }, [id, dispatch]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--color-light-400)', fontSize: '0.875rem' }}>
        Loading...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--color-light-400)', fontSize: '0.875rem' }}>
        Notification not found.
      </div>
    );
  }

  if (data.type === 'member_invited') {
    return <MemberInvitedTemplate notification={data} />;
  }

  const displayType = getDisplayType(data.type);
  const color = TYPE_COLOR[displayType];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FontAwesomeIcon icon={TYPE_ICON[displayType]} style={{ fontSize: '1.25rem', color }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-light-100)', margin: 0 }}>
          {getTitle(data.type)}
        </h3>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--color-light-300)', lineHeight: 1.6, margin: 0 }}>
        {data.message}
      </p>

      <small style={{ fontSize: '0.72rem', color: 'var(--color-light-400)' }}>
        {new Date(data.createdAt).toLocaleString()}
      </small>

      {data.callback && (
        <a
          href={data.callback}
          style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'underline' }}
        >
          Go to resource
        </a>
      )}
    </div>
  );
};
