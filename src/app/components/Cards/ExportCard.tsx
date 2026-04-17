import s from './ExportCard.module.css';
import { faFileExport, faFingerprint, faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Export } from '../../../interfaces';

export const ExportCard = (props: { exports: Export }) => {
  const { exports } = props || {};

  return (
    <>
      <span className={s.box}>
        <span className={s.iconContainer}>
          <FontAwesomeIcon icon={faFileExport} title='JSON Data' />
        </span>
        <span className={s.info}>
          <h4 className={s.title}>/{exports.name}</h4>
          <small className={s.subtitle}>{exports.description}</small>
        </span>
      </span>

      <span className={s.icons}>
        {
          exports.credentialId && <FontAwesomeIcon icon={faFingerprint} title='Uses credentials' />
        }

        {
          exports.private && <FontAwesomeIcon icon={faLock} title='Private export' />
        }

        <span className={s.methodBadge}>{exports.method}</span>
      </span>
    </>
  )
}
