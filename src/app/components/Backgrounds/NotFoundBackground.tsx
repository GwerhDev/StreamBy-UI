import s from './NotFoundBackground.module.css';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const NotFoundBackground = () => {
  return (
    <div className={s.container}>
      <span>
        <FontAwesomeIcon icon={faBan} size="10x" />
      </span>
      <h2>404 - Not Found</h2>
    </div>
  );
};
