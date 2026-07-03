import s from './DeliverableTab.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxArchive } from '@fortawesome/free-solid-svg-icons';

export function DeliverableTab() {
  return (
    <div className={s.empty}>
      <FontAwesomeIcon icon={faBoxArchive} className={s.emptyIcon} />
      <p>Deliverables are managed through Workflows — available in Phase 4.</p>
    </div>
  );
}
