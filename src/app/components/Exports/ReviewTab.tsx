import s from './ReviewTab.module.css';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments, faCircleCheck, faCircleXmark,
  faClock, faHourglass, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { getProjectReviews } from '../../../services/exports';
import { ReviewSession, ReviewStatus } from '../../../interfaces';

interface Props {
  projectId: string;
  assetId?: string;
}

const STATUS_ICON: Record<ReviewStatus, typeof faCircleCheck> = {
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

function ReviewRow({ review }: { review: ReviewSession }) {
  const icon = STATUS_ICON[review.status];
  const cls = STATUS_CLASS[review.status];
  const approvedCount = review.approvals.filter(a => a.decision === 'approve').length;
  return (
    <div className={s.reviewRow}>
      <div className={s.reviewInfo}>
        <span className={s.reviewId}>Session {review.id.slice(-6)}</span>
        <span className={s.reviewMeta}>
          {approvedCount}/{review.requiredApprovers} approvals
          {review.deadline && (
            <> · due {new Date(review.deadline).toLocaleDateString()}</>
          )}
        </span>
      </div>
      <span className={`${s.statusBadge} ${cls}`}>
        <FontAwesomeIcon icon={icon} />
        {review.status}
      </span>
    </div>
  );
}

export function ReviewTab({ projectId, assetId }: Props) {
  const [reviews, setReviews] = useState<ReviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProjectReviews(projectId)
      .then((data: ReviewSession[]) => {
        if (cancelled) return;
        const filtered = assetId ? data.filter((r: ReviewSession) => r.assetId === assetId) : data;
        setReviews(filtered);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectId, assetId]);

  if (loading) {
    return (
      <div className={s.center}>
        <FontAwesomeIcon icon={faSpinner} spin className={s.loadingIcon} />
      </div>
    );
  }

  if (error) {
    return <div className={s.center}><p className={s.errorText}>{error}</p></div>;
  }

  if (!reviews.length) {
    return (
      <div className={s.empty}>
        <FontAwesomeIcon icon={faComments} className={s.emptyIcon} />
        <p>No review sessions found.</p>
      </div>
    );
  }

  return (
    <div className={s.container}>
      {reviews.map(r => <ReviewRow key={r.id} review={r} />)}
    </div>
  );
}
