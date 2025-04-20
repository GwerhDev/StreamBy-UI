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
  const { projectList, loadProjects } = useProjects();
  const { logged } = session;

  useEffect(() => {
    (async () => {
      loadProjects([]);
      if (!logged) return;
      const projects = await fetchProjects();
      loadProjects(projects);
    })();
  }, [logged]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="p-4">
        <div className='dashboard-container'>
          <LateralTab userData={session} projectList={projectList} />
          <Outlet />
        </div>
      </main>
      <LogoutModal />
    </div>
  );
}
