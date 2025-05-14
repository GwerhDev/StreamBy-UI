import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import s from './NotFoundBackground.module.css';
import { faBan } from '@fortawesome/free-solid-svg-icons';

export const NotFoundBackground = () => {
  return (
    <div className={s.container}>
      <FontAwesomeIcon icon={faBan} size="2xl" />
    </div>
  );
};
