import s from './Background.module.css';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface EmptyBackgroundProps {
  icon?: IconDefinition;
  title?: string;
  subtitle?: string;
}

export const EmptyBackground = ({
  icon = faBan,
  title = 'Emptiness is filling me',
  subtitle,
}: EmptyBackgroundProps = {}) => {
  return (
    <div className={s.container}>
      <span>
        <FontAwesomeIcon icon={icon} size="10x" />
      </span>
      <h4>{title}</h4>
      {subtitle && <p className={s.subtitle}>{subtitle}</p>}
    </div>
  );
};
