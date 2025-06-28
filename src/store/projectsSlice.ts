import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectList } from '../interfaces';

const initialState: ProjectList[] = [];

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (_, action) => action.payload,
    addProject: (state, action: PayloadAction<ProjectList>) => {
      state.push(action.payload);
    },
    removeProject: (state, action: PayloadAction<string>) => {
      return state.filter(p => p.id !== action.payload);
    },
  },
});

export const { setProjects, addProject, removeProject } = projectsSlice.actions;
export default projectsSlice.reducer;
