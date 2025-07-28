import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { useDispatch, useSelector } from 'react-redux';
import { useProjects } from '../../hooks/useProjects';
import { fetchDatabases } from '../../store/managementSlice';
import { LateralTab } from '../components/LateralTab/LateralTab';
import { LogoutModal } from '../components/Modals/LogoutModal';
import { DbInfoButton } from '../components/DbInfo/DbInfoButton';

export default function DefaultLayout() {
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { name, image } = currentProject.data || {};
  const { projectList } = useProjects();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchDatabases());
  }, [dispatch]);

  return (
    <main>
      <div className='dashboard-container'>
        <LateralTab userData={session} projectList={projectList} />
        <div className="project-viewer">
          <div className="header-app">
            <span className="w-full"/>
            <span className="title-container">
              {
                image &&
                <img src={image} alt="" />
              }
              <small className="font-bold nowrap">{name || "StreamBy"}</small>
            </span>
            <DbInfoButton />
          </div>
          <Outlet />
        </div>
      </div>
      <LogoutModal />
    </main>
  );
}
