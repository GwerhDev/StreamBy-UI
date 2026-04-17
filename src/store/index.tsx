import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice';
import projectsReducer from './projectsSlice';
import currentProjectReducer from './currentProjectSlice';
import currentExportReducer from './currentExportSlice';
import managementReducer from './managementSlice';
import apiResponsesReducer from './apiResponsesSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    projects: projectsReducer,
    currentProject: currentProjectReducer,
    currentExport: currentExportReducer,
    management: managementReducer,
    apiResponses: apiResponsesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
