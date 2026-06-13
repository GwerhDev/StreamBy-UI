import s from './ProjectButton.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { Project } from '../../../interfaces';

export const ProjectButton = (props: { project: Project, loading: boolean }) => {
  const { project, loading } = props || {};
  const { name, image, id } = project || {};
  const params = useParams();
  const navigate = useNavigate();
  const currentProjectId = params.id;

  const handleOnClick = () => {
    navigate(`/project/${id}/dashboard/overview`);
  };

  const container = currentProjectId === id ? `${s.container} ${s.selected}` : s.container;

  if (loading) {
    return (
      <button className={`${s.containerSkeleton} ${skeleton.skeleton}`}>
        <span className={`${s.defaultImageSkeleton} ${skeleton.skeleton}`}></span>
      </button>
    );
  }

  return (
    <button title={name} onClick={handleOnClick} className={container}>
      <span>
        {image
          ? <img className={s.image} src={image} alt="" />
          : <span className={s.defaultImage}>{project.name[0]}</span>
        }
      </span>
    </button>
  );
};
