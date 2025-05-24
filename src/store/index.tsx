import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice';
import projectsReducer from './projectsSlice';
import currentProjectReducer from './currentProjectSlice';
import archivedProjectsReducer from './archivedProjectsSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    projects: projectsReducer,
    currentProject: currentProjectReducer,
    archivedProjects: archivedProjectsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
