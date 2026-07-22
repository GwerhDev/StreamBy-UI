import s from './PipelineCard.module.css';
import { faDiagramProject } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PipelineRef } from '../../../interfaces';

export const PipelineCard = (props: { pipeline: PipelineRef }) => {
  const { pipeline } = props || {};

  return (
    <>
      <span className={s.box}>
        <span className={s.iconContainer}>
          <FontAwesomeIcon icon={faDiagramProject} title='Pipeline' />
        </span>
        <span className={s.info}>
          <h4 className={s.title}>{pipeline.name}</h4>
          <small className={s.subtitle}>Sub-workflow</small>
        </span>
      </span>
    </>
  )
}
