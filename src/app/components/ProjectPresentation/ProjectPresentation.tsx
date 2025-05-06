import s from './ProjectPresentation.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import streambyIcon from '../../../assets/streamby-icon.svg';

export const ProjectPresentation = () => {
  const currentProject = useSelector((state: RootState) => state.currentProject);

  const handleEdit = async () => {
    const editProjectModal = document.getElementById("edit-project-modal") as HTMLDivElement | null;
    if (editProjectModal) editProjectModal.style.display = "flex";
  };

  return (
    <div className={s.container}>
      <div className={s.detailsContainer}>
        <ul>
          <li className={s.imgContainer}>
            <span className={s.imageContainer}>
              {
                currentProject.image
                  ? <img src={currentProject.image} alt="Project image" className={s.image} />
                  : <img src={streambyIcon} className={s.defaultImage} />
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
