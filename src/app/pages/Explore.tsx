import { ExploreContent } from '../components/Explore/ExploreContent';

export const Explore = () => {
  return (
    <div className="dashboard-sections">
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <ExploreContent />
      </div>
    </div>
  );
};
