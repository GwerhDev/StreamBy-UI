import s from './WaitingWorkers.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglassHalf, faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Props {
  // Whoever sees it may run jobs in the project: only then can they start them.
  canStart: boolean;
  starting: boolean;
  onStart: () => void;
}

// A ready deliverable whose automatic workers are still waiting, and starting them.
export function WaitingWorkers({ canStart, starting, onStart }: Props) {
  return (
    <span className={s.waiting} data-testid="workers-waiting">
      <span className={s.label}><FontAwesomeIcon icon={faHourglassHalf} /> Workers waiting</span>
      {canStart && (
        <button type="button" className={s.start} disabled={starting} onClick={onStart}>
          <FontAwesomeIcon icon={starting ? faSpinner : faPlay} spin={starting} /> {starting ? 'Starting…' : 'Start workers'}
        </button>
      )}
    </span>
  );
}
