import s from './GateStatus.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faLock } from '@fortawesome/free-solid-svg-icons';
import { GateState } from '../../../interfaces';

// Whether the gates before something (in the workflow) let it out: ready, or blocked, and then
// each gate that holds it and what it lacks. Nothing when it has no gates before it.
export function GateStatus({ state }: { state: Partial<GateState> }) {
  if (!state.gated || !state.status) return null;
  const blocked = state.status === 'blocked';
  return (
    <span className={s.status} data-testid="gate-status">
      <span className={`${s.badge} ${blocked ? s.blocked : s.ready}`}>
        <FontAwesomeIcon icon={blocked ? faLock : faCircleCheck} />
        {blocked ? 'Blocked' : 'Ready'}
      </span>
      {blocked && !!state.blockedBy?.length && (
        <ul className={s.reasons} aria-label="What holds it">
          {state.blockedBy.map(b => (
            <li key={b.nodeId}><strong>{b.label}</strong>: {b.reason}</li>
          ))}
        </ul>
      )}
    </span>
  );
}
