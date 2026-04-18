import s from './ProjectPreviewContent.module.css';
import { ProjectPresentation } from '../ProjectPresentation/ProjectPresentation';

export const ProjectPreviewContent = () => {
  return (
    <div className={s.container}>
      <ProjectPresentation preview />
    </div>
  );
};
