import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootState } from './store';
import { useSelector } from 'react-redux';

import { useInitSession } from './hooks/useInitSession';
import { useWebSocket } from './hooks/useWebSocket';

import DefaultLayout from './app/layouts/DefaultLayout';
import ProjectLayout from './app/layouts/ProjectLayout';
import PreviewLayout from './app/layouts/PreviewLayout';
import EditorLayout from './app/layouts/EditorLayout';
import NotificationLayout from './app/layouts/NotificationLayout';

import { Loader } from './app/components/Loader';
import { ToastNotification } from './app/components/Notifications/ToastNotification';
import { RootBackground } from './app/components/Backgrounds/RootBackground';

import { UserNotification } from './app/pages/UserNotification';
import { UserNotificationDetail } from './app/pages/UserNotificationDetail';
import { ProjectPreview } from './app/pages/ProjectPreview';

const Api = lazy(() => import('./app/pages/Api').then(module => ({ default: module.Api })));
const Home = lazy(() => import('./app/pages/Home').then(module => ({ default: module.Home })));
const Images = lazy(() => import('./app/pages/Images').then(module => ({ default: module.Images })));
const Videos = lazy(() => import('./app/pages/Videos').then(module => ({ default: module.Videos })));
const Audios = lazy(() => import('./app/pages/Audios').then(module => ({ default: module.Audios })));
const Storage = lazy(() => import('./app/components/Storage/Storage').then(module => ({ default: module.Storage })));
const Exports = lazy(() => import('./app/pages/Exports').then(module => ({ default: module.Exports })));
const Members = lazy(() => import('./app/pages/Members').then(module => ({ default: module.Members })));
const Overview = lazy(() => import('./app/pages/Overview').then(module => ({ default: module.Overview })));
const NotFound = lazy(() => import('./app/pages/NotFound').then(module => ({ default: module.NotFound })));
const Database = lazy(() => import('./app/pages/Database').then(module => ({ default: module.Database })));
const Settings = lazy(() => import('./app/pages/Settings').then(module => ({ default: module.Settings })));
const Dashboard = lazy(() => import('./app/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const UserAccount = lazy(() => import('./app/pages/UserAccount').then(module => ({ default: module.UserAccount })));
const UserArchive = lazy(() => import('./app/pages/UserArchive').then(module => ({ default: module.UserArchive })));
const Permissions = lazy(() => import('./app/pages/Permissions').then(module => ({ default: module.Permissions })));
const Unauthorized = lazy(() => import('./app/pages/Unauthorized').then(module => ({ default: module.Unauthorized })));
const OverviewEdit = lazy(() => import('./app/pages/OverviewEdit').then(module => ({ default: module.OverviewEdit })));
const ThreeDModels = lazy(() => import('./app/pages/ThreeDModels').then(module => ({ default: module.ThreeDModels })));
const StorageDrive = lazy(() => import('./app/components/Storage/StorageDrive').then(module => ({ default: module.StorageDrive })));
const ProjectCreate = lazy(() => import('./app/pages/ProjectCreate').then(module => ({ default: module.ProjectCreate })));
const ExportsCreate = lazy(() => import('./app/pages/ExportsCreate').then(module => ({ default: module.ExportsCreate })));
const ExportsDetails = lazy(() => import('./app/pages/ExportsDetails').then(module => ({ default: module.ExportsDetails })));
const ExportEditorPage = lazy(() => import('./app/pages/ExportEditorPage').then(module => ({ default: module.ExportEditorPage })));
const StorageCategory = lazy(() => import('./app/components/Storage/StorageCategory').then(module => ({ default: module.StorageCategory })));
const CredentialsList = lazy(() => import('./app/pages/CredentialsList').then(module => ({ default: module.CredentialsList })));
const CredentialsCreate = lazy(() => import('./app/pages/CredentialsCreate').then(module => ({ default: module.CredentialsCreate })));
const ApiConnectionEdit = lazy(() => import('./app/pages/ApiConnectionEdit').then(module => ({ default: module.ApiConnectionEdit })));
const ApiConnectionsList = lazy(() => import('./app/pages/ApiConnectionsList').then(module => ({ default: module.ApiConnectionsList })));
const ApiConnectionDetail = lazy(() => import('./app/pages/ApiConnectionDetail').then(module => ({ default: module.ApiConnectionDetail })));
const ApiConnectionsCreate = lazy(() => import('./app/pages/ApiConnectionsCreate').then(module => ({ default: module.ApiConnectionsCreate })));

function App() {
  const session = useSelector((state: RootState) => state.session);
  const { loader } = session;
  useInitSession();
  useWebSocket();

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
                <Route element={<NotificationLayout />}>
                  <Route path="/user/notification" element={<UserNotification />} />
                  <Route path="/user/notification/:id" element={<UserNotificationDetail />} />
                </Route>
                <Route element={<PreviewLayout />}>
                  <Route path="/preview/:projectId" element={<ProjectPreview />} />
                </Route>
                <Route element={<EditorLayout />}>
                  <Route path="/editor/:projectId/:exportId" element={<ExportEditorPage />} />
                </Route>

                <Route path="/project/:id" element={<ProjectLayout />}>
                  <Route path="/project/:id" element={<RootBackground />} />
                  <Route path="/project/:id/dashboard" element={<Dashboard />} />
                  <Route path="/project/:id/dashboard/overview" element={<Overview />} />
                  <Route path="/project/:id/dashboard/overview/edit" element={<OverviewEdit />} />
                  <Route path="/project/:id/dashboard/members" element={<Members />} />
                  <Route path="/project/:id/dashboard/exports" element={<Exports />} />
                  <Route path="/project/:id/dashboard/exports/create" element={<ExportsCreate />} />
                  <Route path="/project/:id/dashboard/exports/:exportId" element={<ExportsDetails />} />

                  <Route path="/project/:id/storage" element={<Storage />} />
                  <Route path="/project/:id/storage/:storageName" element={<StorageDrive />} />
                  <Route path="/project/:id/storage/:storageName/:contentType" element={<StorageCategory />} />
                  <Route path="/project/:id/storage/images" element={<Images />} />
                  <Route path="/project/:id/storage/videos" element={<Videos />} />
                  <Route path="/project/:id/storage/audios" element={<Audios />} />
                  <Route path="/project/:id/storage/3d-models" element={<ThreeDModels />} />

                  <Route path="/project/:id/database" element={<Database />} />

                  <Route path="/project/:id/connections" element={<Api />} />
                  <Route path="/project/:id/connections/api" element={<ApiConnectionsList />} />
                  <Route path="/project/:id/connections/api/create" element={<ApiConnectionsCreate />} />
                  <Route path="/project/:id/connections/api/:apiConnectionId" element={<ApiConnectionDetail />} />
                  <Route path="/project/:id/connections/api/:apiConnectionId/edit" element={<ApiConnectionEdit />} />

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
      <ToastNotification />
    </>
  );
}

export default App;
