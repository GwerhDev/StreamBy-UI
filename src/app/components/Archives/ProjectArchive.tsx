import s from './ProjectArchive.module.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../store';
import { ProjectCard } from '../Cards/ProjectCard';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ProjectList } from '../../../interfaces';

export const ProjectArchive = () => {
  const projects = useSelector((state: RootState) => state.projects);
  const navigate = useNavigate();
  const filteredList = projects.list.filter((project: ProjectList) => project.archived);

  return (
    <div className={s.container}>
      {filteredList.length === 0 ? (
        <EmptyBackground />
      ) : (
        <div className={s.createContainer}>
          <div className={s.title}>
            <h2>The Archives</h2>
            <p>Choose a project</p>
          </div>
          <ul>
            {filteredList.map((project: ProjectList) => (
              <li
                title={project.name}
                key={project.id}
                onClick={() => navigate('/project/' + project.id + '/dashboard/overview')}
              >
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
