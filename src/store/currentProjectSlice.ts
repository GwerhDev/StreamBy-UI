import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CurrentProjectState, MembershipInfo, Project } from '../interfaces';

const initialState: CurrentProjectState = {
  data: { id: "", name: "", public: false },
  loading: true,
  error: null,
  membership: null,
  removingIds: [],
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
    // A resource being removed, shown so until the server answers (with the list as it is then).
    setResourceRemoving: (state, action: PayloadAction<{ id: string; removing: boolean }>) => {
      const others = (state.removingIds ?? []).filter(id => id !== action.payload.id);
      state.removingIds = action.payload.removing ? [...others, action.payload.id] : others;
    },
    // One of the project's resources, fetched on its own (see useProjectResource).
    setProjectResource: <K extends keyof Project>(state: CurrentProjectState, action: PayloadAction<{ projectId: string; key: K; value: Project[K] }>) => {
      const { projectId, key, value } = action.payload;
      if (state.data?.id !== projectId) return;
      state.data = { ...state.data, [key]: value };
    },
  },
});

export const { setCurrentProject, setMembership, clearCurrentProject, setProjectLoading, setProjectResource, setResourceRemoving } = currentProjectSlice.actions;
export default currentProjectSlice.reducer;
