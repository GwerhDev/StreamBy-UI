import s from './ExportCard.module.css';
import { faRocket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { exportList } from '../../../interfaces';

export const ExportCard = (props: { exports: exportList }) => {
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
      <FontAwesomeIcon icon={faRocket} />
    </>
  )
}
