import { Routes, Route } from 'react-router-dom';
import { RootState } from './store';
import { useSelector } from 'react-redux';
import { useInitSession } from './hooks/useInitSession';
import ProjectLayout from './app/layouts/ProjectLayout';
import DefaultLayout from './app/layouts/DefaultLayout';
import { Home } from './app/pages/Home';
import { Images } from './app/pages/Images';
import { Videos } from './app/pages/Videos';
import { Audios } from './app/pages/Audios';
import { Storage } from './app/pages/Storage';
import { Overview } from './app/pages/Overview';
import { NotFound } from './app/pages/NotFound';
import { Database } from './app/pages/Database';
import { Settings } from './app/pages/Settings';
import { Dashboard } from './app/pages/Dashboard';
import { UserArchive } from './app/pages/UserArchive';
import { Unauthorized } from './app/pages/Unauthorized';
import { OverviewEdit } from './app/pages/OverviewEdit';
import { ThreeDModels } from './app/pages/ThreeDModels';
import { ProjectCreate } from './app/pages/ProjectCreate';
import { Loader } from './app/components/Loader';
import { RootBackground } from './app/components/Backgrounds/RootBackground';
import { UserAccount } from './app/pages/UserAccount';
import { Exports } from './app/pages/Exports';
import { ExportsCreate } from './app/pages/ExportsCreate';
import { ExportsDetails } from './app/pages/ExportsDetails';
import { Members } from './app/pages/Members';
import { Toast } from './app/components/Toast/Toast';

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
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route element={<DefaultLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/project/create" element={<ProjectCreate />} />
              <Route path="/user" element={<UserAccount />} />
              <Route path="/user/archive" element={<UserArchive />} />

              <Route path="/project/:id" element={<ProjectLayout />}>
                <Route path="/project/:id" element={<RootBackground />} />
                <Route path="/project/:id/dashboard" element={<Dashboard />} />
                <Route path="/project/:id/dashboard/overview" element={<Overview />} />
                <Route path="/project/:id/dashboard/overview/edit" element={<OverviewEdit />} />
                <Route path="/project/:id/dashboard/members" element={<Members />} />
                <Route path="/project/:id/dashboard/exports" element={<Exports />} />
                <Route path="/project/:id/dashboard/exports/create" element={<ExportsCreate />} />
                <Route path="/project/:id/dashboard/exports/:export_id" element={<ExportsDetails />} />

                <Route path="/project/:id/storage" element={<Storage />} />
                <Route path="/project/:id/storage/images" element={<Images />} />
                <Route path="/project/:id/storage/videos" element={<Videos />} />
                <Route path="/project/:id/storage/audios" element={<Audios />} />
                <Route path="/project/:id/storage/3dmodels" element={<ThreeDModels />} />

                <Route path="/project/:id/database" element={<Database />} />

                <Route path="/project/:id/settings" element={<Settings />} />
                <Route path="/project/:id/not-found" element={<NotFound />} />
                <Route path="/project/:id/*" element={<NotFound />} />

              </Route>
              <Route path="/project/:id/not-found" element={<NotFound />} />
              <Route path="/project/:id/*" element={<NotFound />} />
              <Route path="/project/not-found" element={<NotFound />} />
              <Route path="/project/*" element={<NotFound />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
      }
      <Toast />
    </>
  );
}

export default App;
