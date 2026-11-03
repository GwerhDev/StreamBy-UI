import s from './PriorityIcon.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesDown, faAnglesUp, faEquals } from '@fortawesome/free-solid-svg-icons';
import { TaskPriority } from '../../../interfaces';
import { PRIORITY_LABEL } from './shots';

const ICON = { high: faAnglesUp, medium: faEquals, low: faAnglesDown };

// A priority as an icon, its name for who can't see it: high up, medium level, low down.
export function PriorityIcon({ priority, title }: { priority: TaskPriority; title?: string }) {
  const label = `${PRIORITY_LABEL[priority]} priority`;
  return (
    <span className={`${s.icon} ${s[priority]}`} title={title ?? label} role="img" aria-label={label}>
      <FontAwesomeIcon icon={ICON[priority]} />
    </span>
  );
}
