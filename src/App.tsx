import { Routes, Route } from 'react-router-dom';
import { RootState } from './store';
import { useSelector } from 'react-redux';
import { useInitSession } from './hooks/useInitSession';
import { Loader } from './app/components/Loader';
import { Toast } from './app/components/Toast/Toast';
import { RootBackground } from './app/components/Backgrounds/RootBackground';
import { lazy, Suspense } from 'react';
import DefaultLayout from './app/layouts/DefaultLayout';
import ProjectLayout from './app/layouts/ProjectLayout';

const Home = lazy(() => import('./app/pages/Home').then(module => ({ default: module.Home })));
const Images = lazy(() => import('./app/pages/Images').then(module => ({ default: module.Images })));
const Videos = lazy(() => import('./app/pages/Videos').then(module => ({ default: module.Videos })));
const Audios = lazy(() => import('./app/pages/Audios').then(module => ({ default: module.Audios })));
const Storage = lazy(() => import('./app/pages/Storage').then(module => ({ default: module.Storage })));
const Exports = lazy(() => import('./app/pages/Exports').then(module => ({ default: module.Exports })));
const Members = lazy(() => import('./app/pages/Members').then(module => ({ default: module.Members })));
const Overview = lazy(() => import('./app/pages/Overview').then(module => ({ default: module.Overview })));
const NotFound = lazy(() => import('./app/pages/NotFound').then(module => ({ default: module.NotFound })));
const Database = lazy(() => import('./app/pages/Database').then(module => ({ default: module.Database })));
const Settings = lazy(() => import('./app/pages/Settings').then(module => ({ default: module.Settings })));
const Dashboard = lazy(() => import('./app/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const UserAccount = lazy(() => import('./app/pages/UserAccount').then(module => ({ default: module.UserAccount })));
const UserArchive = lazy(() => import('./app/pages/UserArchive').then(module => ({ default: module.UserArchive })));
const Unauthorized = lazy(() => import('./app/pages/Unauthorized').then(module => ({ default: module.Unauthorized })));
const OverviewEdit = lazy(() => import('./app/pages/OverviewEdit').then(module => ({ default: module.OverviewEdit })));
const ThreeDModels = lazy(() => import('./app/pages/ThreeDModels').then(module => ({ default: module.ThreeDModels })));
const ProjectCreate = lazy(() => import('./app/pages/ProjectCreate').then(module => ({ default: module.ProjectCreate })));
const ExportsCreate = lazy(() => import('./app/pages/ExportsCreate').then(module => ({ default: module.ExportsCreate })));
const ExportsDetails = lazy(() => import('./app/pages/ExportsDetails').then(module => ({ default: module.ExportsDetails })));
const ExportsEdit = lazy(() => import('./app/pages/ExportsEdit').then(module => ({ default: module.ExportsEdit })));
const Permissions = lazy(() => import('./app/pages/Permissions').then(module => ({ default: module.Permissions })));
const CredentialsList = lazy(() => import('./app/pages/CredentialsList').then(module => ({ default: module.CredentialsList })));
const CredentialsCreate = lazy(() => import('./app/pages/CredentialsCreate').then(module => ({ default: module.CredentialsCreate })));

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
          <Suspense fallback={<Loader />}>
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
                  <Route path="/project/:id/dashboard/exports/:exportId" element={<ExportsDetails />} />
                  <Route path="/project/:id/dashboard/exports/:exportId/edit" element={<ExportsEdit />} />

                  <Route path="/project/:id/storage" element={<Storage />} />
                  <Route path="/project/:id/storage/images" element={<Images />} />
                  <Route path="/project/:id/storage/videos" element={<Videos />} />
                  <Route path="/project/:id/storage/audios" element={<Audios />} />
                  <Route path="/project/:id/storage/3dmodels" element={<ThreeDModels />} />

                  <Route path="/project/:id/database" element={<Database />} />

                  <Route path="/project/:id/settings" element={<Settings />} />
                  <Route path="/project/:id/settings/permissions" element={<Permissions />} />
                  <Route path="/project/:id/settings/credentials" element={<CredentialsList />} />
                  <Route path="/project/:id/settings/credentials/create" element={<CredentialsCreate />} />
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
          </Suspense>
      }
      <Toast />
    </>
  );
}

export default App;
