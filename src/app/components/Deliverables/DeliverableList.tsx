import s from './DeliverableList.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxArchive } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';

export function DeliverableList() {
  return (
    <div className={s.container}>
      <SectionHeader
        icon={faBoxArchive}
        title="Deliverables"
        subtitle="Deliverables are the output of Workflows — available in Phase 4."
      />
      <div className={s.emptyState}>
        <FontAwesomeIcon icon={faBoxArchive} className={s.emptyIcon} />
        <p>No deliverables yet. Build a Workflow to generate and distribute deliverables.</p>
      </div>
    </div>
  );
}
