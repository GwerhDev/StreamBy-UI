import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CurrentPipelineState, Pipeline } from '../interfaces';

const initialState: CurrentPipelineState = {
  data: null,
  loading: false,
  error: null,
};

const currentPipelineSlice = createSlice({
  name: 'currentPipeline',
  initialState,
  reducers: {
    setCurrentPipeline: (state, action: PayloadAction<Pipeline>) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearCurrentPipeline: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    setPipelineLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setPipelineError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setCurrentPipeline, clearCurrentPipeline, setPipelineLoading, setPipelineError } = currentPipelineSlice.actions;
export default currentPipelineSlice.reducer;
