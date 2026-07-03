import { ProjectArchive } from '../components/Archives/ProjectArchive';

export const UserArchive = () => (
  <div className="dashboard-sections">
    <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
      <ProjectArchive />
    </div>
  </div>
);
