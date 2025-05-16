import s from './ProjectPresentation.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useNavigate } from 'react-router-dom';

export const ProjectPresentation = () => {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { image, name, description } = currentProject || {};
  const navigate = useNavigate();

  const handleEdit = async () => {
    navigate('/project/' + currentProject.id + '/dashboard/overview/edit');
  };

  return (
    <div className={s.container}>
      <ul>
        <li className={s.imgContainer}>
          <span className={s.imageContainer}>
            {
              image
                ? <img src={image} alt="Project image" className={s.image} />
                : <span>{name[0]}</span>
            }
          </span>
        </li>
      </ul>
      <ul className={s.details}>
        <li className={s.title}>
          <h1>{name}</h1>
        </li>

        <li>
          <p>{description}</p>
        </li>
        <li>
          <span className={s.buttonContainer}>
            <ActionButton onClick={handleEdit} icon={faEdit} text="Edit" type="submit" />
          </span>
        </li>
      </ul>
    </div>
  );
};
