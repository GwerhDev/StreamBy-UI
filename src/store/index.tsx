import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice';
import projectsReducer from './projectsSlice';
import currentProjectReducer from './currentProjectSlice';
import currentExportReducer from './currentExportSlice';
import managementReducer from './managementSlice';
import apiResponsesReducer from './apiResponsesSlice';
import notificationsReducer from './notificationsSlice';
import currentNotificationReducer from './currentNotificationSlice';
import currentStorageFolderReducer from './currentStorageFolderSlice';
import currentJobReducer from './currentJobSlice';
import renderFarmReducer from './renderFarmSlice';
import currentReviewReducer from './currentReviewSlice';
import currentWorkflowReducer from './currentWorkflowSlice';
import currentPipelineReducer from './currentPipelineSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    projects: projectsReducer,
    currentProject: currentProjectReducer,
    currentExport: currentExportReducer,
    management: managementReducer,
    apiResponses: apiResponsesReducer,
    notifications: notificationsReducer,
    currentNotification: currentNotificationReducer,
    currentStorageFolder: currentStorageFolderReducer,
    currentJob: currentJobReducer,
    renderFarm: renderFarmReducer,
    currentReview: currentReviewReducer,
    currentWorkflow: currentWorkflowReducer,
    currentPipeline: currentPipelineReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
