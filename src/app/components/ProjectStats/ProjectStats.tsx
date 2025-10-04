import s from './ProjectStats.module.css';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useNavigate } from 'react-router-dom';
import skeleton from '../Loader/Skeleton.module.css';

export const ProjectStats = () => {
  const { data: currentProject, loading } = useSelector((state: RootState) => state.currentProject);
  const navigate = useNavigate();

  const memberCount = currentProject?.members?.length || 0;
  const exportCount = currentProject?.exports?.length || 0;

  const handleMembersClick = () => {
    if (currentProject) {
      navigate(`/project/${currentProject.id}/dashboard/members`);
    }
  };

  const handleExportsClick = () => {
    if (currentProject) {
      navigate(`/project/${currentProject.id}/dashboard/exports`);
    }
  };

  return (
    <div className={s.statsContainer}>
      <div className={`${s.statCard} ${s.clickable}`} onClick={handleMembersClick}>
        <h4 className={loading ? skeleton.skeleton : ''}>{!loading && "Members"}</h4>
        <p className={loading ? skeleton.skeleton : ''}>{loading ? '' : memberCount}</p>
      </div>
      <div className={`${s.statCard} ${s.clickable}`} onClick={handleExportsClick}>
        <h4 className={loading ? skeleton.skeleton : ''}>{!loading && "Exports"}</h4>
        <p className={loading ? skeleton.skeleton : ''}>{loading ? '' : exportCount}</p>
      </div>
    </div>
  );
};
