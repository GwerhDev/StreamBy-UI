import { Outlet } from 'react-router-dom';
import { LateralTab } from '../components/LateralTab/LateralTab';
import { useEffect } from 'react';
import { fetchProjects } from '../../services/streamby';
import { useProjects } from '../../hooks/useProjects';
import { LogoutModal } from '../components/Modals/LogoutModal';

export default function DefaultLayout(props: any) {
  const { userData } = props || {};
  const { projectList, loadProjects } = useProjects();

  useEffect(() => {
    (async () => {
      const projects = await fetchProjects();
      loadProjects(projects);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-4">
        <div className='dashboard-container'>
          <LateralTab userData={userData} projectList={projectList} />
          <Outlet />
        </div>
      </main>
      <LogoutModal />
    </div>
  );
}
