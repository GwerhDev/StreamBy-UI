import s from './ProjectButton.module.css';
import defaultImg from '../../../assets/default-img.png';
import { useNavigate } from 'react-router-dom';

export const ProjectButton = (props: any) => {
  const { project } = props || {};
  const navigate = useNavigate();

  const handleOnClick = () => {
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
