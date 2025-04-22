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
  const { name } = currentProject || {};
  const { projectList, loadProjects } = useProjects();
  const { logged } = session;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const title = name || "StreamBy";

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
    <main>
      <div className="header-app">
        <span className="icon-container">
          <img onClick={handleGoHome} src={streambyIcon} alt="StreamBy Icon" height={25} />
        </span>
        <span className="title-container">
          <small className="font-bold">{title}</small>
        </span>
      </div>
      <div className='dashboard-container'>
        <LateralTab userData={session} projectList={projectList} />
        <Outlet />
      </div>
      <LogoutModal />
    </main>
  );
}
