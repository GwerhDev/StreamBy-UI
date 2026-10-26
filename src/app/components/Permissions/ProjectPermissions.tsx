import s from './ProjectPermissions.module.css';
import { faShield } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';

// What each role can do in the project. Not configurable yet: only its empty state.
export const ProjectPermissions = () => (
  <div className={s.container}>
    <SectionHeader icon={faShield} title="Permissions" subtitle="What each role can do in this project." />
    <div className={s.emptyState} data-testid="project-permissions-empty">
      <EmptyBackground />
    </div>
  </div>
);
