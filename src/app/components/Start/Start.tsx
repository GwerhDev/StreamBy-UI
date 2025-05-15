import s from './Start.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { faPlus, faRocket } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import defaultImage from '../../../assets/streamby-icon.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const Start = () => {
  const projects = useSelector((state: RootState) => state.projects);
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/project/create');
  };

  return (
    <div className={s.container}>
      {
        projects.length === 0
          ?
          <div className={s.createContainer}>
            <h1>Born to Dev</h1>
            <p>Get started by creating a new project</p>
            <ActionButton icon={faPlus} text='Create project' onClick={handleOnClick} />
          </div>
          :
          <div className={s.createContainer}>
            <h1>Seek and deploy</h1>
            <p>Get started by creating a new project</p>
            <ul>
              {
                projects.map((project: any) => {
                  return (
                    <li key={project.id} onClick={() => navigate('/project/' + project.id + '/dashboard/overview')}>
                      <span className={s.box}>
                        <span className={s.projectImageContainer}>
                          <img className={s.projectImage} src={project.image || defaultImage} alt="" />
                        </span>
                        <h5>
                          {project.name}
                        </h5>
                      </span>
                      <FontAwesomeIcon icon={faRocket} />
                    </li>
                  )
                })
              }
            </ul>
          </div>
      }
    </div >
  )
}
