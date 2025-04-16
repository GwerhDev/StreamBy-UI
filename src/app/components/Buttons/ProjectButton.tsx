import s from './ProjectButton.module.css';
import defaultImg from '../../../assets/default-img.png';

export const ProjectButton = (props: any) => {
  const { action, project } = props || {};

  const handleOnClick = () => {
    return action && project && action(project);
  };

  return (
    <button onClick={handleOnClick} className={s.container}>
      <img src={project?.img || defaultImg} alt="" width={"100%"} />
    </button>
  )
}
