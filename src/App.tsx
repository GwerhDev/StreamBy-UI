import { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootState } from './store';
import { useSelector } from 'react-redux';

import { useInitSession } from './hooks/useInitSession';
import { useWebSocket } from './hooks/useWebSocket';
import { lazyPage, preloadPages } from './utils/lazyPage';

import DefaultLayout from './app/layouts/DefaultLayout';
import ProjectLayout from './app/layouts/ProjectLayout';
import PreviewLayout from './app/layouts/PreviewLayout';
import NotificationLayout from './app/layouts/NotificationLayout';
import UserLayout from './app/layouts/UserLayout';

import { Loader } from './app/components/Loader';
import { ToastNotification } from './app/components/Notifications/ToastNotification';
import { RootBackground } from './app/components/Backgrounds/RootBackground';

import { UserNotification } from './app/pages/UserNotification';
import { UserNotificationDetail } from './app/pages/UserNotificationDetail';
import { ProjectPreview } from './app/pages/ProjectPreview';

const Home = lazyPage(() => import('./app/pages/Home'), 'Home');
const StorageConnectionList = lazyPage(() => import('./app/components/Storage/StorageConnectionList'), 'StorageConnectionList');
const StorageConnectionCreate = lazyPage(() => import('./app/components/Storage/StorageConnectionCreate'), 'StorageConnectionCreate');
const Exports = lazyPage(() => import('./app/pages/Exports'), 'Exports');
const Members = lazyPage(() => import('./app/pages/Members'), 'Members');
const Overview = lazyPage(() => import('./app/pages/Overview'), 'Overview');
const NotFound = lazyPage(() => import('./app/pages/NotFound'), 'NotFound');
const Settings = lazyPage(() => import('./app/pages/Settings'), 'Settings');
const ApiTokens = lazyPage(() => import('./app/pages/ApiTokens'), 'ApiTokens');
const ApiTokenCreate = lazyPage(() => import('./app/pages/ApiTokenCreate'), 'ApiTokenCreate');
const UserApiTokens = lazyPage(() => import('./app/pages/UserApiTokens'), 'UserApiTokens');
const UserApiTokenCreate = lazyPage(() => import('./app/pages/UserApiTokenCreate'), 'UserApiTokenCreate');
const Dashboard = lazyPage(() => import('./app/pages/Dashboard'), 'Dashboard');
const UserHub      = lazyPage(() => import('./app/pages/UserHub'), 'UserHub');
const UserAccount  = lazyPage(() => import('./app/pages/UserAccount'), 'UserAccount');
const UserArchive  = lazyPage(() => import('./app/pages/UserArchive'), 'UserArchive');
const UserSettings = lazyPage(() => import('./app/pages/UserSettings'), 'UserSettings');
const UserIntegrations = lazyPage(() => import('./app/pages/UserIntegrations'), 'UserIntegrations');
const UserIntegrationCreate = lazyPage(() => import('./app/pages/UserIntegrationCreate'), 'UserIntegrationCreate');
const Permissions = lazyPage(() => import('./app/pages/Permissions'), 'Permissions');
const Workers = lazyPage(() => import('./app/pages/Workers'), 'Workers');
const WorkerCreate = lazyPage(() => import('./app/pages/WorkerCreate'), 'WorkerCreate');
const AllowedOrigins = lazyPage(() => import('./app/pages/AllowedOrigins'), 'AllowedOrigins');
const AllowedOriginsCreate = lazyPage(() => import('./app/pages/AllowedOriginsCreate'), 'AllowedOriginsCreate');
const Unauthorized = lazyPage(() => import('./app/pages/Unauthorized'), 'Unauthorized');
const OverviewEdit = lazyPage(() => import('./app/pages/OverviewEdit'), 'OverviewEdit');
const StorageDrive = lazyPage(() => import('./app/components/Storage/StorageDrive'), 'StorageDrive');
const ProjectCreate = lazyPage(() => import('./app/pages/ProjectCreate'), 'ProjectCreate');
const ExportsCreate = lazyPage(() => import('./app/pages/ExportsCreate'), 'ExportsCreate');
const ExportsDetails = lazyPage(() => import('./app/pages/ExportsDetails'), 'ExportsDetails');
const ExportEditorPage = lazyPage(() => import('./app/pages/ExportEditorPage'), 'ExportEditorPage');
const ConnectionEdit = lazyPage(() => import('./app/pages/ConnectionEdit'), 'ConnectionEdit');
const ConnectionsList = lazyPage(() => import('./app/pages/ConnectionsList'), 'ConnectionsList');
const ConnectionDetail = lazyPage(() => import('./app/pages/ConnectionDetail'), 'ConnectionDetail');
const ConnectionsCreate = lazyPage(() => import('./app/pages/ConnectionsCreate'), 'ConnectionsCreate');
const DatabaseConnections      = lazyPage(() => import('./app/pages/DatabaseConnections'), 'DatabaseConnections');
const DatabaseConnectionCreate = lazyPage(() => import('./app/pages/DatabaseConnectionCreate'), 'DatabaseConnectionCreate');
const DatabaseConnectionDetail = lazyPage(() => import('./app/pages/DatabaseConnectionDetail'), 'DatabaseConnectionDetail');
const DatabaseTableCreate      = lazyPage(() => import('./app/pages/DatabaseTableCreate'), 'DatabaseTableCreate');
const DatabaseRecords          = lazyPage(() => import('./app/pages/DatabaseRecords'), 'DatabaseRecords');
const IntegrationConnections      = lazyPage(() => import('./app/pages/IntegrationConnections'), 'IntegrationConnections');
const IntegrationConnectionCreate = lazyPage(() => import('./app/pages/IntegrationConnectionCreate'), 'IntegrationConnectionCreate');
const Explore                  = lazyPage(() => import('./app/pages/Explore'), 'Explore');
const JobMonitorPage           = lazyPage(() => import('./app/pages/JobMonitorPage'), 'JobMonitorPage');
const ReviewListPage           = lazyPage(() => import('./app/pages/ReviewListPage'), 'ReviewListPage');
const ReviewPlayerPage         = lazyPage(() => import('./app/pages/ReviewPlayerPage'), 'ReviewPlayerPage');
const DeliverableListPage      = lazyPage(() => import('./app/pages/DeliverableListPage'), 'DeliverableListPage');
const ProductionBoardPage      = lazyPage(() => import('./app/pages/ProductionBoardPage'), 'ProductionBoardPage');
const WorkflowPage             = lazyPage(() => import('./app/pages/WorkflowPage'), 'WorkflowPage');
const Pipelines                = lazyPage(() => import('./app/pages/Pipelines'), 'Pipelines');
const PipelineCreate           = lazyPage(() => import('./app/pages/PipelineCreate'), 'PipelineCreate');
const PipelineDetails          = lazyPage(() => import('./app/pages/PipelineDetails'), 'PipelineDetails');
const PipelineEditorPage       = lazyPage(() => import('./app/pages/PipelineEditorPage'), 'PipelineEditorPage');

function App() {
  const session = useSelector((state: RootState) => state.session);
  const { loader } = session;
  useInitSession();
  useWebSocket();

  useEffect(() => { if (!loader) preloadPages(); }, [loader]);

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
                <Route path="/explore" element={<Explore />} />
                <Route element={<UserLayout />}>
                  <Route path="/user" element={<UserHub />} />
                  <Route path="/user/profile" element={<UserAccount />} />
                  <Route path="/user/archive" element={<UserArchive />} />
                  <Route path="/user/settings" element={<UserSettings />} />
                  <Route path="/user/settings/api-tokens" element={<UserApiTokens />} />
                  <Route path="/user/settings/api-tokens/create" element={<UserApiTokenCreate />} />
                  <Route path="/user/integrations" element={<UserIntegrations />} />
                  <Route path="/user/integrations/create" element={<UserIntegrationCreate />} />
                </Route>
                <Route element={<NotificationLayout />}>
                  <Route path="/user/notification" element={<UserNotification />} />
                  <Route path="/user/notification/:id" element={<UserNotificationDetail />} />
                </Route>
                <Route element={<PreviewLayout />}>
                  <Route path="/preview/:projectId" element={<ProjectPreview />} />
                </Route>
                <Route path="/project/:id" element={<ProjectLayout />}>
                  <Route path="/project/:id" element={<RootBackground />} />
                  <Route path="/project/:id/dashboard" element={<Dashboard />} />
                  <Route path="/project/:id/dashboard/overview" element={<Overview />} />
                  <Route path="/project/:id/dashboard/overview/edit" element={<OverviewEdit />} />
                  <Route path="/project/:id/dashboard/members" element={<Members />} />

                  <Route path="/project/:id/storage" element={<StorageConnectionList />} />
                  <Route path="/project/:id/storage/create" element={<StorageConnectionCreate />} />
                  <Route path="/project/:id/storage/:connId" element={<StorageDrive />} />
                  <Route path="/project/:id/storage/:connId/:segment" element={<StorageDrive />} />

                  <Route path="/project/:id/database" element={<DatabaseConnections />} />
                  <Route path="/project/:id/database/create" element={<DatabaseConnectionCreate />} />
                  <Route path="/project/:id/database/:connId/create" element={<DatabaseTableCreate />} />
                  <Route path="/project/:id/database/:connId/:tableName" element={<DatabaseRecords />} />
                  <Route path="/project/:id/database/:connId" element={<DatabaseConnectionDetail />} />

                  <Route path="/project/:id/services" element={<IntegrationConnections />} />
                  <Route path="/project/:id/services/create" element={<IntegrationConnectionCreate />} />

                  <Route path="/project/:id/workers" element={<Workers />} />
                  <Route path="/project/:id/workers/create" element={<WorkerCreate />} />

                  <Route path="/project/:id/connections" element={<ConnectionsList />} />
                  <Route path="/project/:id/connections/create" element={<ConnectionsCreate />} />
                  <Route path="/project/:id/connections/:connectionId" element={<ConnectionDetail />} />
                  <Route path="/project/:id/connections/:connectionId/edit" element={<ConnectionEdit />} />

                  <Route path="/project/:id/workflow" element={<WorkflowPage />} />
                  <Route path="/project/:id/workflow/pipelines" element={<Pipelines />} />
                  <Route path="/project/:id/workflow/pipelines/create" element={<PipelineCreate />} />
                  <Route path="/project/:id/workflow/pipelines/:pipelineId" element={<PipelineDetails />} />
                  <Route path="/project/:id/workflow/pipelines/:pipelineId/editor" element={<PipelineEditorPage />} />
                  <Route path="/project/:id/workflow/exports" element={<Exports />} />
                  <Route path="/project/:id/workflow/exports/create" element={<ExportsCreate />} />
                  <Route path="/project/:id/workflow/exports/:exportId" element={<ExportsDetails />} />
                  <Route path="/project/:id/workflow/exports/:exportId/editor" element={<ExportEditorPage />} />
                  <Route path="/project/:id/workflow/production" element={<ProductionBoardPage />} />
                  <Route path="/project/:id/workflow/jobs" element={<JobMonitorPage />} />
                  <Route path="/project/:id/workflow/reviews" element={<ReviewListPage />} />
                  <Route path="/project/:id/workflow/review/:sessionId" element={<ReviewPlayerPage />} />
                  <Route path="/project/:id/workflow/deliverables" element={<DeliverableListPage />} />

                  <Route path="/project/:id/settings" element={<Settings />} />
                  <Route path="/project/:id/settings/api-tokens" element={<ApiTokens />} />
                  <Route path="/project/:id/settings/api-tokens/create" element={<ApiTokenCreate />} />
                  <Route path="/project/:id/settings/allowed-origins" element={<AllowedOrigins />} />
                  <Route path="/project/:id/settings/allowed-origins/create" element={<AllowedOriginsCreate />} />
                  <Route path="/project/:id/settings/permissions" element={<Permissions />} />

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
