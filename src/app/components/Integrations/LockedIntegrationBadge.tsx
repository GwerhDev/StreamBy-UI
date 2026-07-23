import s from './LockedIntegrationBadge.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { SecondaryButton } from '../Buttons/SecondaryButton';

interface LockedIntegrationBadgeProps {
  requiredPlan?: string;
  onUpgrade?: () => void;
}

export const LockedIntegrationBadge = ({ requiredPlan, onUpgrade }: LockedIntegrationBadgeProps) => (
  <div className={s.container}>
    <FontAwesomeIcon icon={faLock} className={s.icon} />
    <span className={s.text}>
      {requiredPlan ? `Requires ${requiredPlan} plan` : 'Requires a higher plan'}
    </span>
    <SecondaryButton text="Upgrade" onClick={() => onUpgrade?.()} />
  </div>
);
