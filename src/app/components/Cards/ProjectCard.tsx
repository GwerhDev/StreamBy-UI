import s from './ProjectCard.module.css';
import { faRocket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProjectList } from '../../../interfaces';

export const ProjectCard = (props: { project: ProjectList }) => {
  const { project } = props || {};

  return (
    <>
      <span className={s.box}>
        <span className={s.projectImageContainer}>
          {
            project.image
              ? <img className={s.projectImage} src={project.image} alt="" />
              : <span>{project.name[0]}</span>
          }
        </span>
        <h4>
          {project.name}
        </h4>
      </span>
      <FontAwesomeIcon icon={faRocket} />
    </>
  )
}
