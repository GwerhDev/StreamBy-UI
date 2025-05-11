import s from './ProjectButton.module.css';
import defaultImg from '../../../assets/streamby-icon.svg';
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

  const imageContainerClass = currentProjectId === id ? `${s.imageContainer} ${s.selected}` : s.imageContainer;

  return (
    <button title={name} onClick={handleOnClick} className={s.container}>
      <span className={imageContainerClass}>
        {
          image 
            ? <img className={s.image} src={image} alt="" /> 
            : <img className={s.defaultImage} height={30} src={defaultImg} alt="" />
        }
      </span>
    </button>
  );
};
