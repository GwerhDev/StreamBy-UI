import s from './ReviewList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments, faCircleCheck, faCircleXmark, faClock, faHourglass,
} from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { getProjectReviews } from '../../../services/exports';
import { ReviewSession, ReviewStatus } from '../../../interfaces';

const STATUS_ICON: Record<ReviewStatus, typeof faComments> = {
  open: faHourglass,
  approved: faCircleCheck,
  rejected: faCircleXmark,
  expired: faClock,
};

const STATUS_CLASS: Record<ReviewStatus, string> = {
  open: s.statusOpen,
  approved: s.statusApproved,
  rejected: s.statusRejected,
  expired: s.statusExpired,
};

const STATUS_LABEL: Record<ReviewStatus, string> = {
  open: 'Open',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

export function ReviewList() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    getProjectReviews(projectId)
      .then((data: ReviewSession[]) => { if (!cancelled) setReviews(data); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  return (
    <div className={s.container}>
      <div className={s.header}>
        <SectionHeader icon={faComments} title="Reviews" subtitle="Review sessions for assets in this project" />
      </div>

      {loading ? (
        <div className={s.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${s.rowSkeleton} ${skeleton.skeleton}`} />
          ))}
        </div>
      ) : error ? (
        <div className={s.empty}><p className={s.errorText}>{error}</p></div>
      ) : !reviews.length ? (
        <div className={s.empty}>
          <FontAwesomeIcon icon={faComments} className={s.emptyIcon} />
          <p>No review sessions yet.</p>
        </div>
      ) : (
        <div className={s.list}>
          <div className={s.listHeader}>
            <span className={s.colAsset}>Asset</span>
            <span className={s.colApprovals}>Approvals</span>
            <span className={s.colDeadline}>Deadline</span>
            <span className={s.colDate}>Created</span>
            <span className={s.colStatus}>Status</span>
          </div>
          {reviews.map(r => {
            const approved = r.approvals.filter(a => a.decision === 'approve').length;
            return (
              <div
                key={r.id}
                className={s.row}
                onClick={() => navigate(`/project/${projectId}/review/${r.id}`)}
              >
                <span className={s.colAsset} title={r.assetId}>{r.assetId.slice(-8)}</span>
                <span className={s.colApprovals}>{approved}/{r.requiredApprovers}</span>
                <span className={s.colDeadline}>
                  {r.deadline ? new Date(r.deadline).toLocaleDateString() : '—'}
                </span>
                <span className={s.colDate}>{new Date(r.createdAt).toLocaleDateString()}</span>
                <span className={`${s.statusBadge} ${STATUS_CLASS[r.status]}`}>
                  <FontAwesomeIcon icon={STATUS_ICON[r.status]} />
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
