import s from './ProjectPresentation.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { faEdit, faDatabase, faTable } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useNavigate } from 'react-router-dom';
import { ProjectStats } from '../ProjectStats/ProjectStats';
import { ProjectCharts } from '../ProjectCharts/ProjectCharts';

export const ProjectPresentation = () => {
  const { data: currentProject, loading } = useSelector((state: RootState) => state.currentProject);
  const { image, name, description, dbType } = currentProject || {};
  const navigate = useNavigate();

  const handleEdit = async () => {
    navigate('/project/' + currentProject?.id + '/dashboard/overview/edit');
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <ul>
          <li className={`${s.imgContainer} ${loading ? s.borderAnimate : ''}`}>
            <span className={`${s.imageContainer} ${loading ? skeleton.skeleton : ''}`}>
              {
                !loading && (
                  image
                    ? <img src={image} alt="Project image" className={s.image} />
                    : <span>{name ? name[0] : ''}</span>
                )
              }
            </span>
          </li>
          <>
            {!loading && dbType && (
              <li className={`${s.dbType} ${loading ? skeleton.skeleton : ''}`}>
                <FontAwesomeIcon icon={dbType === "sql" ? faTable : faDatabase} title={dbType} />
                <span>{dbType}</span>
              </li>
            )}
          </>
        </ul>
        <ul className={s.details}>
          <li className={`${s.title} ${loading ? skeleton.skeleton : ''}`}>
            {!loading && <h1>{name}</h1>}
          </li>

          <li className={`${loading ? skeleton.skeleton : ''}`}>
            {!loading && <p>{description}</p>}
          </li>

          <li>
            <span className={`${s.buttonContainer} ${loading ? skeleton.skeleton : ''}`}>
              {!loading && <ActionButton onClick={handleEdit} icon={faEdit} text="Edit" type="submit" />}
            </span>
          </li>
        </ul>
      </div>
      <div className={s.stats}>
        <ProjectStats />
        <ProjectCharts />
      </div>
    </div>
  );
};
