import s from './ExploreButton.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';

export const ExploreButton = (props: { onClick: () => void }) => {
  const { pathname } = useLocation();
  const isActive = pathname === '/explore';

  return (
    <button
      title="Explore projects"
      onClick={props.onClick}
      className={`${s.container} ${isActive ? s.active : ''}`}
    >
      <FontAwesomeIcon
        icon={faCompass}
        size="lg"
        color={isActive ? 'var(--color-accent)' : 'var(--color-text-primary)'}
      />
    </button>
  );
};
