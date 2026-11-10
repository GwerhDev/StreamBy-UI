import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { ProjectList } from '../interfaces';
import { fetchProjects } from '../services/projects';

export interface ProjectsState {
  list: ProjectList[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  list: [],
  loading: true,
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
      state.error = null;
    },
    setProjectsError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { setProjects, addProject, removeProject, setProjectsLoading, setProjectsError } = projectsSlice.actions;

/** The user's projects, read again (after something changed them: an invitation accepted). */
export const reloadProjects = () => async (dispatch: Dispatch) => {
  dispatch(setProjectsLoading());
  try {
    dispatch(setProjects(await fetchProjects()));
  } catch (err) {
    dispatch(setProjectsError(err instanceof Error ? err.message : 'Failed to load projects'));
  }
};
export default projectsSlice.reducer;
