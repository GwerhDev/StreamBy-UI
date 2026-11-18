import s from './ReviewPlayer.module.css';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faCircleCheck, faCircleXmark, faClock, faHourglass, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { getReview } from '../../../services/reviews';
import { AssetVersionSummary, getAssetVersions } from '../../../services/assetMeasurements';
import { ReviewSession } from '../../../interfaces';
import { RootState } from '../../../store';
import { useRoleCan } from '../../../hooks/useRoleCan';
import { AudioReview } from './AudioReview';
import { isAudioVersion } from '../../../utils/audioVersion';

const STATUS_ICON = {
  open: faHourglass,
  approved: faCircleCheck,
  rejected: faCircleXmark,
  expired: faClock,
};

export function ReviewPlayer() {
  const { id: projectId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [versions, setVersions] = useState<AssetVersionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const myRole = useSelector((state: RootState) =>
    state.currentProject?.data?.members?.find(m => m.userId === state.session?.userId)?.role);
  const canNote = useRoleCan(projectId, myRole, 'assets:write');
  const canMakeTasks = useRoleCan(projectId, myRole, 'production:write');

  useEffect(() => {
    if (!projectId || !sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const found = await getReview(projectId, sessionId);
        // Its asset's versions: what it is (audio is reviewed on its waveform), and what it's compared with.
        const list = await getAssetVersions(projectId, found.assetId).catch(() => [] as AssetVersionSummary[]);
        if (cancelled) return;
        setSession(found);
        setVersions(list);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Review session not found.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
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
        {isAudioVersion(versions.find(v => v.versionId === session.assetVersionId)) ? (
          <AudioReview projectId={projectId!} session={session} versions={versions} canNote={canNote} canMakeTasks={canMakeTasks} />
        ) : (
          <div className={s.playerPlaceholder}>
            <FontAwesomeIcon icon={icon} className={s.placeholderIcon} />
            <p className={s.placeholderText}>Asset player coming soon</p>
            <p className={s.placeholderSub}>Asset ID: <code>{session.assetId}</code></p>
          </div>
        )}

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
