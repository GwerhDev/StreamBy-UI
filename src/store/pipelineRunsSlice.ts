import { createSlice } from '@reduxjs/toolkit';

// How many times the websocket told that a pipeline's run changed: whatever shows runs reads
// them again on each one.
interface PipelineRunsState {
  eventSeq: number;
}

const initialState: PipelineRunsState = { eventSeq: 0 };

const pipelineRunsSlice = createSlice({
  name: 'pipelineRuns',
  initialState,
  reducers: {
    pipelineRunEventReceived(state) {
      state.eventSeq += 1;
    },
  },
});

export const { pipelineRunEventReceived } = pipelineRunsSlice.actions;
export default pipelineRunsSlice.reducer;
