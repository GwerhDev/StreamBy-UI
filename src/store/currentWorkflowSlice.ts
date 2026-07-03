import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CurrentWorkflowState, Workflow } from '../interfaces';

const initialState: CurrentWorkflowState = {
  data: null,
  loading: false,
  error: null,
};

const currentWorkflowSlice = createSlice({
  name: 'currentWorkflow',
  initialState,
  reducers: {
    setCurrentWorkflow: (state, action: PayloadAction<Workflow>) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearCurrentWorkflow: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    setWorkflowLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setWorkflowError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setCurrentWorkflow, clearCurrentWorkflow, setWorkflowLoading, setWorkflowError } = currentWorkflowSlice.actions;
export default currentWorkflowSlice.reducer;
