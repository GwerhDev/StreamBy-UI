import s from './PipelineRuns.module.css';
import { RunStatus, StepStatus } from '../../../interfaces';

const LABELS: Record<StepStatus | RunStatus, string> = {
  waiting: 'Waiting', active: 'In progress', running: 'Running', done: 'Done', failed: 'Failed',
  completed: 'Completed', cancelled: 'Cancelled',
};

const TONE: Record<StepStatus | RunStatus, string> = {
  waiting: s.muted, active: s.info, running: s.info, done: s.success, failed: s.danger, completed: s.success, cancelled: s.muted,
};

// Where a step (or a run) is: waiting, in progress, running, done or failed.
export function StepStatusBadge({ status }: { status: StepStatus | RunStatus }) {
  return <span className={`${s.badge} ${TONE[status]}`} data-testid="step-status">{LABELS[status]}</span>;
}
