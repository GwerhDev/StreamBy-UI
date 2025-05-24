import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../interfaces';

const initialState: Project[] = [];

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (_, action) => action.payload,
    addProject: (state, action: PayloadAction<Project>) => {
      state.push(action.payload);
    },
    removeProject: (state, action: PayloadAction<string>) => {
      return state.filter(p => p.id !== action.payload);
    },
  },
});

export const { setProjects, addProject, removeProject } = projectsSlice.actions;
export default projectsSlice.reducer;
