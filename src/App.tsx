import { Routes, Route } from 'react-router-dom';
import { RootState } from './store';
import { useSelector } from 'react-redux';
import { useInitSession } from './hooks/useInitSession';
import DefaultLayout from './app/layouts/DefaultLayout';
import ProjectLayout from './app/layouts/PorjectLayout';
import { Loader } from './app/components/Loader';
import { Login } from './app/pages/Login';
import { Images } from './app/pages/Images';
import { Videos } from './app/pages/Videos';
import { Audios } from './app/pages/Audios';
import { Project } from './app/pages/Project';
import { Overview } from './app/pages/Overview';
import { NotFound } from './app/pages/NotFound';
import { Dashboard } from './app/pages/Dashboard';
import { ThreeDModels } from './app/pages/ThreeDModels';
import { ProjectCreate } from './app/pages/ProjectCreate';
import { Home } from './app/pages/Home';
import { Storage } from './app/pages/Storage';
import { Database } from './app/pages/Database';
import { Settings } from './app/pages/Settings';

function App() {
  const session = useSelector((state: RootState) => state.session);
  const { loader } = session;
  useInitSession();

  return (
    <>
      {
        loader
          ?
          <Loader />
          :
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<DefaultLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/project/create" element={<ProjectCreate />} />
              <Route path="/project/:id" element={<Project />} />
              <Route element={<ProjectLayout />}>
                <Route path="/project/:id/dashboard" element={<Dashboard />} />
                <Route path="/project/:id/dashboard/overview" element={<Overview />} />

                <Route path="/project/:id/storage" element={<Storage />} />
                <Route path="/project/:id/storage/images" element={<Images />} />
                <Route path="/project/:id/storage/videos" element={<Videos />} />
                <Route path="/project/:id/storage/audios" element={<Audios />} />
                <Route path="/project/:id/storage/3dmodels" element={<ThreeDModels />} />

                <Route path="/project/:id/database" element={<Database />} />

                <Route path="/project/:id/settings" element={<Settings />} />
              </Route>
              <Route path="/project/not-found" element={<NotFound />} />
              <Route path="/project/*" element={<NotFound />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
      }
    </>
  );
}

export default App;
