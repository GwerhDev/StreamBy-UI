import s from './ReviewPlayer.module.css';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faCircleCheck, faCircleXmark, faClock, faHourglass, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { getProjectReviews } from '../../../services/exports';
import { ReviewSession } from '../../../interfaces';

const STATUS_ICON = {
  open: faHourglass,
  approved: faCircleCheck,
  rejected: faCircleXmark,
  expired: faClock,
};

export function ReviewPlayer() {
  const { id: projectId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !sessionId) return;
    let cancelled = false;
    getProjectReviews(projectId)
      .then((data: ReviewSession[]) => {
        if (cancelled) return;
        const found = data.find((r: ReviewSession) => r.id === sessionId) ?? null;
        if (!found) setError('Review session not found.');
        else setSession(found);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, sessionId]);

  if (loading) {
    return (
      <div className={s.center}>
        <FontAwesomeIcon icon={faSpinner} spin className={s.spinner} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className={s.center}>
        <p className={s.errorText}>{error ?? 'Session not found.'}</p>
      </div>
    );
  }

  const approvedCount = session.approvals.filter(a => a.decision === 'approve').length;
  const rejectedCount = session.approvals.filter(a => a.decision === 'reject').length;
  const icon = STATUS_ICON[session.status];

  return (
    <div className={s.container}>
      <div className={s.header}>
        <SectionHeader
          icon={faComments}
          title={`Review · ${session.id.slice(-8)}`}
          subtitle={`Asset ${session.assetId}`}
          badge={session.status}
        />
      </div>

      <div className={s.body}>
        <div className={s.playerPlaceholder}>
          <FontAwesomeIcon icon={icon} className={s.placeholderIcon} />
          <p className={s.placeholderText}>Asset player coming soon</p>
          <p className={s.placeholderSub}>Asset ID: <code>{session.assetId}</code></p>
        </div>

        <div className={s.sidebar}>
          <div className={s.sidebarSection}>
            <span className={s.sidebarLabel}>Status</span>
            <span className={s.sidebarValue}>{session.status}</span>
          </div>
          <div className={s.sidebarSection}>
            <span className={s.sidebarLabel}>Approvals</span>
            <span className={s.sidebarValue}>{approvedCount} / {session.requiredApprovers}</span>
          </div>
          {rejectedCount > 0 && (
            <div className={s.sidebarSection}>
              <span className={s.sidebarLabel}>Rejections</span>
              <span className={`${s.sidebarValue} ${s.rejected}`}>{rejectedCount}</span>
            </div>
          )}
          {session.deadline && (
            <div className={s.sidebarSection}>
              <span className={s.sidebarLabel}>Deadline</span>
              <span className={s.sidebarValue}>{new Date(session.deadline).toLocaleDateString()}</span>
            </div>
          )}
          <div className={s.sidebarSection}>
            <span className={s.sidebarLabel}>Created</span>
            <span className={s.sidebarValue}>{new Date(session.createdAt).toLocaleDateString()}</span>
          </div>

          {session.approvals.length > 0 && (
            <div className={s.approvalList}>
              <span className={s.sidebarLabel}>Votes</span>
              {session.approvals.map((a, i) => (
                <div key={i} className={s.approvalRow}>
                  <FontAwesomeIcon
                    icon={a.decision === 'approve' ? faCircleCheck : faCircleXmark}
                    className={a.decision === 'approve' ? s.approveIcon : s.rejectIcon}
                  />
                  <span className={s.approvalUser}>{a.username}</span>
                  {a.comment && <span className={s.approvalComment}>{a.comment}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
