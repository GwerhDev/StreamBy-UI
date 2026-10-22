import s from './DeliverableTab.module.css';
import { DeliverableItems } from '../Deliverables/DeliverableItems';

interface DeliverableTabProps {
  projectId: string;
  exportId: string;
}

// The assets delivered for this export (marked from the API or by an agent).
export function DeliverableTab({ projectId, exportId }: DeliverableTabProps) {
  return (
    <div className={s.container}>
      <DeliverableItems projectId={projectId} of={{ exportId }} />
    </div>
  );
}
