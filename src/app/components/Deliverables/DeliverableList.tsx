import s from './DeliverableList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxArchive, faCloudArrowUp, faCircleCheck, faCircleXmark, faClock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { Export, DeliveryStatus } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';

const STATUS_ICON: Record<DeliveryStatus, typeof faCircleCheck> = {
  published: faCircleCheck,
  failed: faCircleXmark,
  publishing: faSpinner,
  pending: faClock,
};

const STATUS_CLASS: Record<DeliveryStatus, string> = {
  published: s.statusPublished,
  failed: s.statusFailed,
  publishing: s.statusPublishing,
  pending: s.statusPending,
};

function overallStatus(exp: Export): DeliveryStatus {
  const targets = exp.deliverableTargets ?? [];
  if (!targets.length) return 'pending';
  if (targets.some(t => t.status === 'failed')) return 'failed';
  if (targets.some(t => t.status === 'publishing')) return 'publishing';
  if (targets.every(t => t.status === 'published')) return 'published';
  return 'pending';
}

export function DeliverableList() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, loading } = useSelector((state: RootState) => state.currentProject);
  const deliverables = (project?.exports ?? []).filter((e: Export) => !!e.deliverableType);

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faBoxArchive}
        title="Deliverables"
        subtitle="Exports configured with a deliverable type and distribution targets."
      />

      {loading ? (
        <ul>
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : !deliverables.length ? (
        <div className={s.emptyState}><EmptyBackground /></div>
      ) : (
        <ul>
          {deliverables.map((exp: Export) => {
            const status = overallStatus(exp);
            const icon = STATUS_ICON[status];
            const cls = STATUS_CLASS[status];
            const targetCount = exp.deliverableTargets?.length ?? 0;
            return (
              <li
                key={exp.id}
                className={s.card}
                onClick={() => navigate(`/project/${projectId}/dashboard/exports/${exp.id}`)}
              >
                <div className={s.cardIcon}>
                  <FontAwesomeIcon icon={faBoxArchive} />
                </div>
                <div className={s.cardInfo}>
                  <span className={s.cardName}>{exp.name}</span>
                  <span className={s.cardMeta}>
                    {exp.deliverableType}
                    {exp.deliverableVersion && ` · v${exp.deliverableVersion}`}
                    {targetCount > 0 && ` · ${targetCount} target${targetCount !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <span className={`${s.statusBadge} ${cls}`}>
                  <FontAwesomeIcon icon={icon} spin={status === 'publishing'} />
                  {status}
                </span>
                <FontAwesomeIcon icon={faCloudArrowUp} className={s.cardArrow} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
