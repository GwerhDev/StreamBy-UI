import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JobRecord } from '../interfaces';

interface JobsState {
  jobs: Record<string, JobRecord>;
}

const initialState: JobsState = { jobs: {} };

const currentJobSlice = createSlice({
  name: 'currentJob',
  initialState,
  reducers: {
    upsertJob(state, action: PayloadAction<JobRecord>) {
      state.jobs[action.payload.jobId] = action.payload;
    },
    completeJob(state, action: PayloadAction<string>) {
      const job = state.jobs[action.payload];
      if (job) job.progress = 100;
    },
    failJob(state, action: PayloadAction<{ jobId: string; error: string }>) {
      const job = state.jobs[action.payload.jobId];
      if (job) job.error = action.payload.error;
    },
  },
});

export const { upsertJob, completeJob, failJob } = currentJobSlice.actions;
export default currentJobSlice.reducer;
