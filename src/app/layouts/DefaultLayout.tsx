import { Outlet } from 'react-router-dom';
import { LateralTab } from '../components/LateralTab/LateralTab';
import { useEffect } from 'react';
import { fetchProjects } from '../../services/streamby';
import { useProjects } from '../../hooks/useProjects';
import { LogoutModal } from '../components/Modals/LogoutModal';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function DefaultLayout() {
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { name, image } = currentProject || {};
  const { projectList, loadProjects } = useProjects();
  const { logged } = session;
  const title = name || "StreamBy";

  useEffect(() => {
    (async () => {
      loadProjects([]);
      if (!logged) return;
      const projects = await fetchProjects();
      loadProjects(projects);
    })();
  }, [logged]);

  return (
    <main>
      <div className='dashboard-container'>
        <LateralTab userData={session} projectList={projectList} />
        <div className="project-viewer">
          <div className="header-app">
            <span className="title-container">
              {
                image &&
                <img src={image} alt="" />
              }
              <small className="font-bold">{title}</small>
            </span>
          </div>
          <Outlet />
        </div>
      </div>
      <LogoutModal />
    </main>
  );
}
