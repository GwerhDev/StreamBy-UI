import s from './ProjectButton.module.css';
import defaultImg from '../../../assets/streamby-icon.svg';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCurrentProject } from '../../../store/currentProjectSlice';

export const ProjectButton = (props: any) => {
  const { project } = props || {};
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setCurrentProject(project));
    navigate(`/project/${project.id}`);
  };

  return (
    <button onClick={handleOnClick} className={s.container}>
      <span>
        {
          project?.image ? <img src={project?.image} alt="" /> : <img className={s.defaultImage} src={defaultImg} alt="" />
        }
      </span>
    </button>
  )
}
