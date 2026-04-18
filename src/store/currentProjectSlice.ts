import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CurrentProjectState, MembershipInfo, Project } from '../interfaces';

const initialState: CurrentProjectState = {
  data: { id: "", name: "" },
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
  },
});

export const { setCurrentProject, setMembership, clearCurrentProject, setProjectLoading } = currentProjectSlice.actions;
export default currentProjectSlice.reducer;
