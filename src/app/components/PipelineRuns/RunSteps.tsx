import s from './PipelineRuns.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faUser, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Member, RunStep, Team } from '../../../interfaces';
import { StepStatusBadge } from './StepStatusBadge';
import { completedByText } from './pipelineSteps';

interface Props {
  steps: RunStep[];
  members: Member[];
  teams: Team[];
}

// A run's steps: each one's state, what it waits on, and who completes it.
export function RunSteps({ steps, members, teams }: Props) {
  return (
    <ol className={s.steps}>
      {steps.map(step => {
        const by = completedByText(step.completedBy, members, teams);
        const icon = step.completedBy && 'worker' in step.completedBy ? faMicrochip
          : step.completedBy && step.completedBy.teamIds.length ? faUsers : faUser;
        return (
          <li key={step.nodeId} className={`${s.step} ${step.status === 'active' || step.status === 'running' ? s.current : ''}`} data-testid={`step-${step.nodeId}`}>
            <div className={s.stepHead}>
              <span className={s.stepLabel}>{step.label}</span>
              <StepStatusBadge status={step.status} />
            </div>
            {by && (
              <span className={s.stepBy} title="Who completes it">
                <FontAwesomeIcon icon={icon} /> {by}
              </span>
            )}
            {step.reason && step.status !== 'done' && <span className={s.stepReason}>{step.reason}</span>}
          </li>
        );
      })}
    </ol>
  );
}
