import s from './ProjectButton.module.css';
import defaultImg from '../../../assets/default-img.png';
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
        <img src={project?.image || defaultImg} alt="" />
      </span>
    </button>
  )
}
