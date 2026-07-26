import s from './ConnectionCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { Connection } from '../../../interfaces';

export const ConnectionCard = ({ connection }: { connection: Connection }) => {
  return (
    <>
      <span className={s.box}>
        <span className={s.iconContainer}>
          <FontAwesomeIcon icon={faCode} />
        </span>
        <span className={s.info}>
          <h4 className={s.title}>{connection.name}</h4>
          <small className={s.subtitle}>{connection.apiUrl}</small>
        </span>
      </span>
      <span className={s.icons}>
        {connection.hasCredential && <FontAwesomeIcon icon={faFingerprint} title="Uses credentials" />}
        <span className={s.methodBadge}>{connection.method}</span>
      </span>
    </>
  );
};
