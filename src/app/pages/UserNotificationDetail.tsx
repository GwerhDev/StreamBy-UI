import s from './UserNotificationDetail.module.css';
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

const TYPE_ICON_CLASS = {
  success: s.iconSuccess,
  warning: s.iconWarning,
  error:   s.iconError,
  info:    s.iconInfo,
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
    return <div className={s.empty}>Loading...</div>;
  }

  if (error || !data) {
    return <div className={s.empty}>Notification not found.</div>;
  }

  if (data.type === 'member_invited') {
    return <MemberInvitedTemplate notification={data} />;
  }

  const displayType = getDisplayType(data.type);

  return (
    <div className={s.container}>
      <div className={s.header}>
        <FontAwesomeIcon icon={TYPE_ICON[displayType]} className={`${s.icon} ${TYPE_ICON_CLASS[displayType]}`} />
        <h3 className={s.title}>{getTitle(data.type)}</h3>
      </div>

      <p className={s.message}>{data.message}</p>

      <small className={s.time}>{new Date(data.createdAt).toLocaleString()}</small>

      {data.callback && (
        <a href={data.callback} className={s.callback}>Go to resource</a>
      )}
    </div>
  );
};
