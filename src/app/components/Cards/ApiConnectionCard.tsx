import s from './ApiConnectionCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTowerBroadcast } from '@fortawesome/free-solid-svg-icons';
import { ApiConnection } from '../../../interfaces';

export const ApiConnectionCard = ({ connection }: { connection: ApiConnection }) => {
  return (
    <span className={s.box}>
      <span className={s.iconContainer}>
        <FontAwesomeIcon icon={faTowerBroadcast} />
      </span>
      <span className={s.info}>
        <h4 className={s.title}>{connection.name}</h4>
        <small className={s.url}>{connection.baseUrl}</small>
      </span>
      <span className={s.methodBadge}>{connection.method}</span>
      {connection.credentialId && (
        <span className={s.authBadge} title={connection.prefix ? `Authorization: ${connection.prefix} <credential>` : 'Authorization: <credential>'}>
          {connection.prefix || 'Auth'}
        </span>
      )}
    </span>
  );
};
