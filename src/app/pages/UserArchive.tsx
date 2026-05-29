import { ProjectArchive } from '../components/Archives/ProjectArchive';
import { HomeMenu } from '../components/LateralMenu/HomeMenu';

export const UserArchive = () => {
  return (
    <div className="dashboard-sections">
      <HomeMenu />
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <ProjectArchive />
      </div>
    </div>
  );
};
