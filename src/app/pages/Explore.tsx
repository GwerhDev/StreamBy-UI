import { HomeMenu } from '../components/LateralMenu/HomeMenu';
import { ExploreContent } from '../components/Explore/ExploreContent';

export const Explore = () => {
  return (
    <div className="dashboard-sections">
      <HomeMenu />
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <ExploreContent />
      </div>
    </div>
  );
};
