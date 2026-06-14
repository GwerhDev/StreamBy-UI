import s from './ExploreProjectCard.module.css';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ExploreProject } from '../../../interfaces';

export const ExploreProjectCard = ({ project }: { project: ExploreProject }) => (
  <>
    <span className={s.box}>
      <span className={s.projectImageContainer}>
        {project.image
          ? <img className={s.projectImage} src={project.image} alt="" />
          : <span>{project.name[0]}</span>
        }
      </span>
      <h4 className={s.title}>{project.name}</h4>
    </span>
    <span className={s.right}>
      <span className={s.memberCount}>
        <FontAwesomeIcon icon={faUsers} />
        {project.memberCount}
      </span>
      {project.isMember && <span className={s.badge}>Member</span>}
      {project.hasPendingRequest && <span className={`${s.badge} ${s.badgePending}`}>Pending</span>}
    </span>
  </>
);
