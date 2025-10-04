import s from './ExportCard.module.css';
import { faExternalLink, faFileExport, faLock } from "@fortawesome/free-solid-svg-icons";
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
        exports.private && <FontAwesomeIcon icon={faLock} />
      }
      {
        exports.type === "externalApi" && <FontAwesomeIcon icon={faExternalLink} />
      }

      {
        exports.type === "json" || exports.type === "raw" && <FontAwesomeIcon icon={faFileExport} />
      }
    </>
  )
}
