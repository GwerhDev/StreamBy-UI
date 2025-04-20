import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice';
import projectsReducer from './projectsSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    projects: projectsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;