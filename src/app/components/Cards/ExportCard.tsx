import s from './ExportCard.module.css';
import { faFileExport, faFileImport, faFingerprint, faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Export } from '../../../interfaces';

export const ExportCard = (props: { exports: Export }) => {
  const { exports } = props || {};

  return (
    <>
      <span className={s.box}>
        <span className={s.exportMethodContainer}>
          {exports.method}
        </span>
        <h4 className={s.title}>
          /{exports.name}
        </h4>
      </span>

      {
        exports.credentialId && <FontAwesomeIcon icon={faFingerprint} title='Uses credentials' />
      }

      {
        exports.private && <FontAwesomeIcon icon={faLock} title='Private export' />
      }

      {
        exports.type === "externalApi" && <FontAwesomeIcon icon={faFileImport} title='External API' />
      }

      {
        (exports.type === "json" || exports.type === "raw") && <FontAwesomeIcon icon={faFileExport} title='JSON Data' />
      }
    </>
  )
}
