import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CurrentProjectState, Project } from '../interfaces';

const initialState: CurrentProjectState = {
  data: { id: "", name: "" },
  loading: true,
  error: null,
};

const currentProjectSlice = createSlice({
  name: 'currentProject',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project>) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearCurrentProject: (state) => {
      state.data = initialState.data;
      state.loading = false;
      state.error = null;
    },
    setProjectLoading: (state) => {
      state.loading = true;
    },
  },
});

export const { setCurrentProject, clearCurrentProject, setProjectLoading } = currentProjectSlice.actions;
export default currentProjectSlice.reducer;
