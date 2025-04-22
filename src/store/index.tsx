import { configureStore } from '@reduxjs/toolkit';
import currentProjectReducer from './currentProjectSlice';
import sessionReducer from './sessionSlice';
import projectsReducer from './projectsSlice';

export const store = configureStore({
  reducer: {
    currentProject: currentProjectReducer,
    session: sessionReducer,
    projects: projectsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
