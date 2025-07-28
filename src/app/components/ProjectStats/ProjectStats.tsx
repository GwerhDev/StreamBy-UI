import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import s from './ProjectStats.module.css';
import skeleton from '../Loader/Skeleton.module.css';

export const ProjectStats = () => {
  const { data: currentProject, loading } = useSelector((state: RootState) => state.currentProject);

  const memberCount = currentProject?.members?.length || 0;
  const exportCount = currentProject?.exports?.length || 0;

  return (
    <div className={s.statsContainer}>
      <div className={s.statCard}>
        <h4 className={loading ? skeleton.skeleton : ''}>Members</h4>
        <p className={loading ? skeleton.skeleton : ''}>{loading ? '' : memberCount}</p>
      </div>
      <div className={s.statCard}>
        <h4 className={loading ? skeleton.skeleton : ''}>Exports</h4>
        <p className={loading ? skeleton.skeleton : ''}>{loading ? '' : exportCount}</p>
      </div>
    </div>
  );
};
