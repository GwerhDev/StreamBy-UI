import { Outlet, useParams } from 'react-router-dom';
import { LateralTab } from '../components/LateralTab/LateralTab';
import { useEffect, useState } from 'react';
import { fetchProjects } from '../../services/streamby';
import { useProjects } from '../../hooks/useProjects';
import { LogoutModal } from '../components/Modals/LogoutModal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { clearCurrentProject } from '../../store/currentProjectSlice';
import { fetchDatabases } from '../../store/managementSlice';
import { DbInfoButton } from '../components/DbInfo/DbInfoButton';

export default function DefaultLayout() {
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { name, image } = currentProject || {};
  const { projectList, loadProjects } = useProjects();
  const { logged } = session;
  const [title, setTitle] = useState("StreamBy");
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = params;

  useEffect(() => {
    if (id) {
      setTitle(name || "StreamBy");
    } else {
      setTitle("StreamBy");
      dispatch(clearCurrentProject());
    }
  }, [id, name, dispatch]);

  useEffect(() => {
    (async () => {
      loadProjects([]);
      if (!logged) return;
      const projects = await fetchProjects();
      loadProjects(projects);
    })();
  }, [logged]);

  useEffect(() => {
    dispatch(fetchDatabases());
  }, [dispatch]);

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
            <DbInfoButton />
          </div>
          <Outlet />
        </div>
      </div>
      <LogoutModal />
    </main>
  );
}
