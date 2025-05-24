import s from './ProjectArchive.module.css';
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { useNavigate } from "react-router-dom";
import { ProjectCard } from "../Cards/ProjectCard";
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { Project } from '../../../interfaces';

export const ProjectArchive = () => {
  const archivedProjects = useSelector((state: RootState) => state.archivedProjects);
  const navigate = useNavigate();

  return (
    <div className={s.container}>
      {
        archivedProjects.length === 0
          ?
          <EmptyBackground />
          :
          <div className={s.createContainer}>
            <h2>Archive Enemy</h2>
            <p>Choose a project</p>
            <ul>
              {
                archivedProjects.map((project: Project) => {
                  return (
                    <li key={project.id} onClick={() => navigate('/project/' + project.id + '/dashboard/overview')}>
                      <ProjectCard project={project} />
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
