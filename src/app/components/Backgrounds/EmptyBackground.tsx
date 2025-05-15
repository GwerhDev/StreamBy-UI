import s from './EmptyBackground.module.css';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const EmptyBackground = () => {
  return (
    <div className={s.container}>
      <span>
        <FontAwesomeIcon icon={faFolderOpen} size="10x" />
      </span>
      <small><strong>Watch me freak</strong></small>
    </div>
  );
};
