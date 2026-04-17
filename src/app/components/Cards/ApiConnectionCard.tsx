import s from './ApiConnectionCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { ApiConnection } from '../../../interfaces';

export const ApiConnectionCard = ({ connection }: { connection: ApiConnection }) => {
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
        {connection.credentialId && <FontAwesomeIcon icon={faFingerprint} title="Uses credentials" />}
        <span className={s.methodBadge}>{connection.method}</span>
      </span>
    </>
  );
};
