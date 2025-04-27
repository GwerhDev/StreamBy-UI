import s from './ProjectPresentation.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

export const ProjectPresentation = () => {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const navigate = useNavigate();

  const handleEdit = async () => {
    navigate(`/project/${currentProject.id}/edit`)
  };

  return (
    <div className={s.container}>
      <h3>Overview</h3>
      <p>Dev inside</p>

      <div className={s.detailsContainer}>
        <ul>
          <li className={s.imgContainer}>
            <span className={s.imageContainer}>
              {
                currentProject.image
                  ? <img src={currentProject.image} alt="Project image" className={s.image} />
                  : <img src='' />
              }
            </span>
          </li>
        </ul>
        <ul className={s.details}>
          <li className={s.title}>
            <h1>{currentProject.name}</h1>
            <span className={s.buttonContainer}>
              <ActionButton onClick={handleEdit} icon={faEdit} text="Edit" type="submit" />
            </span>
          </li>

          <li>
            <p>{currentProject.description}</p>
          </li>
        </ul>
      </div>

    </div>
  );
};
