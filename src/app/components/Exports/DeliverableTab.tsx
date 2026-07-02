import s from './DeliverableTab.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxArchive, faCloudArrowUp, faCircleCheck,
  faCircleXmark, faClock, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { Export, DeliveryTarget, DeliveryStatus } from '../../../interfaces';

interface Props {
  exportDetails: Export;
}

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

function DeliveryTargetRow({ target }: { target: DeliveryTarget }) {
  const icon = STATUS_ICON[target.status];
  const cls = STATUS_CLASS[target.status];
  const spinning = target.status === 'publishing';
  return (
    <div className={s.targetRow}>
      <FontAwesomeIcon icon={faCloudArrowUp} className={s.targetIcon} />
      <div className={s.targetInfo}>
        <span className={s.targetName}>{target.target}</span>
        {target.channel && <span className={s.targetChannel}>{target.channel}</span>}
        {target.publishedAt && (
          <span className={s.targetDate}>{new Date(target.publishedAt).toLocaleString()}</span>
        )}
      </div>
      <span className={`${s.statusBadge} ${cls}`}>
        <FontAwesomeIcon icon={icon} spin={spinning} />
        {target.status}
      </span>
    </div>
  );
}

export function DeliverableTab({ exportDetails }: Props) {
  const { deliverableType, deliverableVersion, deliverableTargets } = exportDetails;

  if (!deliverableType) {
    return (
      <div className={s.empty}>
        <FontAwesomeIcon icon={faBoxArchive} className={s.emptyIcon} />
        <p>No deliverable configured for this export.</p>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <FontAwesomeIcon icon={faBoxArchive} className={s.headerIcon} />
        <div>
          <span className={s.type}>{deliverableType}</span>
          {deliverableVersion && <span className={s.version}>v{deliverableVersion}</span>}
        </div>
      </div>

      {deliverableTargets?.length ? (
        <div className={s.targetList}>
          {deliverableTargets.map((t, i) => (
            <DeliveryTargetRow key={`${t.connectionId}-${i}`} target={t} />
          ))}
        </div>
      ) : (
        <div className={s.noTargets}>
          <FontAwesomeIcon icon={faCloudArrowUp} className={s.noTargetsIcon} />
          <p>No delivery targets yet.</p>
        </div>
      )}
    </div>
  );
}
