import s from './Start.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { faPlus, faRocket } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const Start = () => {
  const projects = useSelector((state: RootState) => state.projects);
  const navigate = useNavigate();

  const handleCreateProject = () => {
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
            <ActionButton icon={faPlus} text='Create project' onClick={handleCreateProject} />
          </div>
          :
          <div className={s.createContainer}>
            <h2>Seek and deploy</h2>
            <p>Choose a project</p>
            <ul>
              {
                projects.map((project: any) => {
                  return (
                    <li key={project.id} onClick={() => navigate('/project/' + project.id + '/dashboard/overview')}>
                      <span className={s.box}>
                        <span className={s.projectImageContainer}>
                          {
                            project.image
                              ? <img className={s.projectImage} src={project.image} alt="" />
                              : <span>{project.name[0]}</span>
                          }
                        </span>
                        <h4>
                          {project.name}
                        </h4>
                      </span>
                      <FontAwesomeIcon icon={faRocket} />
                    </li>
                  )
                })
              }
              <li className={s.createProject} onClick={handleCreateProject}>
                <FontAwesomeIcon icon={faPlus} />
                <h4>
                  Create a new Project
                </h4>
              </li>
            </ul>
          </div>
      }
    </div >
  )
}
