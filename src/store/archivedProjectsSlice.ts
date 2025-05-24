import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../interfaces';

const initialState: Project[] = [];

export const archivedProjectsSlice = createSlice({
  name: 'archivedProjects',
  initialState,
  reducers: {
    setArchivedProjects: (_, action) => action.payload,
    addArchivedProject: (state, action: PayloadAction<Project>) => {
      state.push(action.payload);
    },
    removeArchivedProject: (state, action: PayloadAction<string>) => {
      return state.filter(p => p.id !== action.payload);
    },
  },
});

export const { setArchivedProjects, addArchivedProject, removeArchivedProject } = archivedProjectsSlice.actions;
export default archivedProjectsSlice.reducer;
