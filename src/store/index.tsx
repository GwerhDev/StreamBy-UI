import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice';
import projectsReducer from './projectsSlice';
import currentProjectReducer from './currentProjectSlice';
import managementReducer from './managementSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    projects: projectsReducer,
    currentProject: currentProjectReducer,
    management: managementReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
