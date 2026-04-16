import s from './ExportCard.module.css';
import { faFileExport, faFileImport, faFingerprint, faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Export } from '../../../interfaces';

export const ExportCard = (props: { exports: Export }) => {
  const { exports } = props || {};

  return (
    <>
      <span className={s.box}>
        <span className={s.iconContainer}>
          {
            exports.type === "externalApi" && <FontAwesomeIcon icon={faFileImport} title='External API' />
          }

          {
            exports.type === "json" && <FontAwesomeIcon icon={faFileExport} title='JSON Data' />
          }
        </span>
        <h4 className={s.title}>
          /{exports.name}
        </h4>
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
