import { Outlet, useNavigate } from 'react-router-dom';
import { LateralTab } from '../components/LateralTab/LateralTab';
import { useEffect } from 'react';
import { fetchProjects } from '../../services/streamby';
import { useProjects } from '../../hooks/useProjects';
import { LogoutModal } from '../components/Modals/LogoutModal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import streambyIcon from '../../assets/streamby-icon.svg';
import { clearCurrentProject } from '../../store/currentProjectSlice';

export default function DefaultLayout() {
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { projectList, loadProjects } = useProjects();
  const { logged } = session;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoHome = () => {
    dispatch(clearCurrentProject());
    navigate("/");
  };

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
        <div className="header-app">
          <span className="icon-container">
            <img onClick={handleGoHome} src={streambyIcon} alt="StreamBy Icon" height={25} />
          </span>
          <span className="title-container">
            <small className="font-bold">{currentProject ? currentProject.name : "StreamBy"}</small>
          </span>
        </div>
        <div className='dashboard-container'>
          <LateralTab userData={session} projectList={projectList} />
          <Outlet />
        </div>
      </main>
      <LogoutModal />
    </div>
  );
}
