import s from './ProjectButton.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCurrentProject } from '../../../store/currentProjectSlice';

export const ProjectButton = (props: any) => {
  const { project } = props || {};
  const { name, image, id } = project || {};
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProjectId = params.id;

  const handleOnClick = () => {
    dispatch(setCurrentProject(project));
    navigate(`/project/${id}/dashboard/overview`);
  };

  const container = currentProjectId === id ? `${s.container} ${s.selected}` : s.container;

  return (
    <button title={name} onClick={handleOnClick} className={container}>
      <span>
        {
          image
            ? <img className={s.image} src={image} alt="" />
            : <span className={s.defaultImage}>{project.name[0]}</span>
        }
      </span>
    </button>
  );
};
