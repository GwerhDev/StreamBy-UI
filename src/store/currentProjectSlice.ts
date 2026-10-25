import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CurrentProjectState, MembershipInfo, Project } from '../interfaces';

const initialState: CurrentProjectState = {
  data: { id: "", name: "", public: false },
  loading: true,
  error: null,
  membership: null,
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
    setMembership: (state, action: PayloadAction<MembershipInfo | null>) => {
      state.membership = action.payload;
    },
    clearCurrentProject: (state) => {
      state.data = initialState.data;
      state.loading = false;
      state.error = null;
      state.membership = null;
    },
    setProjectLoading: (state) => {
      state.loading = true;
    },
    // One of the project's resources, fetched on its own (see useProjectResource).
    setProjectResource: <K extends keyof Project>(state: CurrentProjectState, action: PayloadAction<{ projectId: string; key: K; value: Project[K] }>) => {
      const { projectId, key, value } = action.payload;
      if (state.data?.id !== projectId) return;
      state.data = { ...state.data, [key]: value };
    },
  },
});

export const { setCurrentProject, setMembership, clearCurrentProject, setProjectLoading, setProjectResource } = currentProjectSlice.actions;
export default currentProjectSlice.reducer;
