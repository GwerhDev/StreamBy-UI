import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectList } from '../interfaces';

export interface ProjectsState {
  list: ProjectList[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  list: [],
  loading: false,
  error: null,
};

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<ProjectList[]>) => {
      state.list = action.payload;
      state.loading = false;
      state.error = null;
    },
    addProject: (state, action: PayloadAction<ProjectList>) => {
      state.list.push(action.payload);
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(p => p.id !== action.payload);
    },
    setProjectsLoading: (state) => {
      state.loading = true;
    },
  },
});

export const { setProjects, addProject, removeProject, setProjectsLoading } = projectsSlice.actions;
export default projectsSlice.reducer;
