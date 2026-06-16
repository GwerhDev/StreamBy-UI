import s from './ProjectStats.module.css';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFileExport, faPlug, faKey } from '@fortawesome/free-solid-svg-icons';
import skeleton from '../Loader/Skeleton.module.css';

interface ProjectStatsProps {
  readonly?: boolean;
}

export const ProjectStats = ({ readonly }: ProjectStatsProps) => {
  const { data: currentProject, loading } = useSelector((state: RootState) => state.currentProject);
  const navigate = useNavigate();

  const id = currentProject?.id ?? '';

  const go = (path: string) => {
    if (!currentProject || readonly) return;
    navigate(path);
  };

  const stats = [
    { icon: faUsers,      label: 'Members',          value: currentProject?.members?.length ?? 0,       path: `/project/${id}/dashboard/members` },
    { icon: faFileExport, label: 'Exports',           value: currentProject?.exports?.length ?? 0,       path: `/project/${id}/dashboard/exports` },
    { icon: faPlug,       label: 'API Connections',   value: currentProject?.apiConnections?.length ?? 0, path: `/project/${id}/api-connections` },
    { icon: faKey,        label: 'Credentials',       value: currentProject?.credentials?.length ?? 0,    path: null },
  ];

  return (
    <div className={s.statsContainer}>
      {stats.map(({ icon, label, value, path }) => {
        const clickable = !!path && !readonly && !loading;
        return (
          <div
            key={label}
            className={`${s.statCard} ${clickable ? s.clickable : s.readonly}`}
            onClick={() => clickable && go(path!)}
          >
            {!loading && <FontAwesomeIcon icon={icon} className={s.statIcon} />}
            <h4 className={loading ? skeleton.skeleton : ''}>{!loading && label}</h4>
            <p className={loading ? skeleton.skeleton : ''}>{loading ? '' : value}</p>
          </div>
        );
      })}
    </div>
  );
};
