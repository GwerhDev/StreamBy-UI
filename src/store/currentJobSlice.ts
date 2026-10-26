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
    // A job event carries part of a job: it's merged into what's known of it.
    upsertJob(state, action: PayloadAction<JobRecord>) {
      state.jobs[action.payload.jobId] = { ...state.jobs[action.payload.jobId], ...action.payload };
    },
    // Jobs as fetched (they're kept by StreamBy, so a reload doesn't lose them).
    upsertJobs(state, action: PayloadAction<JobRecord[]>) {
      for (const job of action.payload) state.jobs[job.jobId] = { ...state.jobs[job.jobId], ...job };
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

export const { upsertJob, upsertJobs, completeJob, failJob } = currentJobSlice.actions;
export default currentJobSlice.reducer;
