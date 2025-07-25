import s from './Start.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ProjectCard } from '../Cards/ProjectCard';
import { ProjectList } from '../../../interfaces';

export const Start = () => {
  const projects = useSelector((state: RootState) => state.projects);
  const filteredList = projects.list.filter((project: ProjectList) => !project.archived);
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate('/project/create');
  };

  return (
    <div className={s.container}>
      {
        filteredList.length === 0
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
                filteredList.map((project: ProjectList) => {
                  return (
                    <li key={project.id} onClick={() => navigate('/project/' + project.id + '/dashboard/overview')}>
                      <ProjectCard project={project} />
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
