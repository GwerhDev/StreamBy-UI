import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../interfaces';

interface CurrentProjectState {
  data: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: CurrentProjectState = {
  data: { id: "", name: "" },
  loading: false,
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
