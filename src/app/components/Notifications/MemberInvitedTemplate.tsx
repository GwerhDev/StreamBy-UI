import s from './MemberInvitedTemplate.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faCheck, faEye } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { acceptInvitation, rejectInvitation } from '../../../services/members';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { ServerNotification } from '../../../store/notificationsSlice';

interface MemberInvitedTemplateProps {
  notification: ServerNotification;
}

export const MemberInvitedTemplate = ({ notification }: MemberInvitedTemplateProps) => {
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.session.userId);
  const { projectId, role } = (notification.data as { projectId: string; role: string; invitedBy: string }) || {};

  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [done, setDone] = useState<'accepted' | 'rejected' | null>(null);

  const handleAccept = async () => {
    if (!projectId || !userId) return;
    setAccepting(true);
    try {
      await acceptInvitation(projectId, userId);
      setDone('accepted');
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!projectId || !userId) return;
    setRejecting(true);
    try {
      await rejectInvitation(projectId, userId);
      setDone('rejected');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.card}>
        <p className={s.message}>{notification.message}</p>

        {role && (
          <span className={s.role}>{role}</span>
        )}

        {done === 'accepted' && (
          <p className={s.feedback + ' ' + s.feedbackAccepted}>Invitation accepted.</p>
        )}
        {done === 'rejected' && (
          <p className={s.feedback + ' ' + s.feedbackRejected}>Invitation rejected.</p>
        )}

        <div className={s.actions}>
          {!done && (
            <>
              <ActionButton
                text="Accept"
                icon={faCheck}
                onClick={handleAccept}
                isLoading={accepting}
                disabled={accepting || rejecting}
              />
              <SecondaryButton
                text="Reject"
                icon={faBan}
                onClick={handleReject}
                disabled={accepting || rejecting || rejecting}
              />
            </>
          )}

          {projectId && (
            <button className={s.previewButton} onClick={() => navigate(`/preview/${projectId}`)}>
              <FontAwesomeIcon icon={faEye} />
              View project
            </button>
          )}
        </div>
      </div>

      <small className={s.date}>
        {new Date(notification.createdAt).toLocaleString()}
      </small>
    </div>
  );
};
