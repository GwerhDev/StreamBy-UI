import s from './ProjectQuickAccess.module.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faHardDrive, faPlug, faUsers, faGear, faShield } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface QuickLink {
  icon: IconDefinition;
  label: string;
  description: string;
  path: string;
  adminOnly?: boolean;
}

const LINKS: QuickLink[] = [
  { icon: faDatabase,  label: 'Database',        description: 'Browse tables and collections',  path: 'database' },
  { icon: faHardDrive, label: 'Storage',          description: 'Manage files and assets',        path: 'storage' },
  { icon: faPlug,      label: 'API Connections',  description: 'External API integrations',      path: 'connections/api' },
  { icon: faUsers,     label: 'Members',          description: 'Manage team access',             path: 'dashboard/members' },
  { icon: faGear,      label: 'Settings',         description: 'Project configuration',          path: 'settings', adminOnly: true },
  { icon: faShield,    label: 'Permissions',      description: 'Allowed origins and access',     path: 'settings/permissions', adminOnly: true },
];

interface ProjectQuickAccessProps {
  projectId: string;
  readonly?: boolean;
}

export const ProjectQuickAccess = ({ projectId, readonly }: ProjectQuickAccessProps) => {
  const navigate = useNavigate();

  const links = readonly ? LINKS.filter(l => !l.adminOnly) : LINKS;

  return (
    <div className={s.container}>
      <h4 className={s.title}>Quick access</h4>
      <div className={s.grid}>
        {links.map(({ icon, label, description, path }) => (
          <div
            key={label}
            className={s.card}
            onClick={() => navigate(`/project/${projectId}/${path}`)}
          >
            <FontAwesomeIcon icon={icon} className={s.icon} />
            <span className={s.label}>{label}</span>
            <span className={s.desc}>{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
