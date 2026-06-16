import s from './ProjectPresentation.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faEdit, faEye } from '@fortawesome/free-solid-svg-icons';

import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useNavigate } from 'react-router-dom';
import { ProjectStats } from '../ProjectStats/ProjectStats';
import { ProjectCharts } from '../ProjectCharts/ProjectCharts';

interface ProjectPresentationProps {
  preview?: boolean;
}

export const ProjectPresentation = ({ preview = false }: ProjectPresentationProps) => {
  const { data: currentProject, loading } = useSelector((state: RootState) => state.currentProject);
  const { image, name, description } = currentProject || {};
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate('/project/' + currentProject?.id + '/dashboard/overview/edit');
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <ul>
          <li className={`${s.imgContainer} ${loading ? s.borderAnimate : ''}`}>
            <span className={`${s.imageContainer} ${loading ? skeleton.skeleton : ''}`}>
              {!loading && (
                image
                  ? <img src={image} alt="Project image" className={s.image} />
                  : <span>{name ? name[0] : ''}</span>
              )}
            </span>
          </li>

        </ul>
        <ul className={s.details}>
          <li className={s.title} >
            {!loading && <h1>{name}</h1>}
          </li>

          <li>
            {!loading && <p>{description}</p>}
          </li>

          {!preview && (
            <li>
              <span className={s.buttonContainer} >
                {!loading && (
                  <>
                    <ActionButton onClick={() => navigate(`/preview/${currentProject?.id}`)} icon={faEye} text="Preview" type="button" />
                    <SecondaryButton onClick={handleEdit} icon={faEdit} text="Edit" />
                  </>
                )}
              </span>
            </li>
          )}
        </ul>
      </div>

      <div className={s.stats}>
        <ProjectStats readonly={preview} />
        <ProjectCharts />
      </div>
    </div>
  );
};
