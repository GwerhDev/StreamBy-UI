import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Worker } from '../interfaces';
import { getWorkers } from '../services/workers';

// The workers of the project being seen: shared by the lateral menu and the Workers page, so
// connecting or removing one shows in both.
interface WorkersState {
  projectId: string | null;
  // null until loaded.
  list: Worker[] | null;
  loading: boolean;
}

const initialState: WorkersState = { projectId: null, list: null, loading: false };

export const fetchWorkers = createAsyncThunk(
  'workers/fetch',
  (projectId: string) => getWorkers(projectId),
  {
    // The menu and the page may ask at once: one request.
    condition: (projectId, { getState }) => {
      const { workers } = getState() as { workers: WorkersState };
      return !(workers.loading && workers.projectId === projectId);
    },
  },
);

const workersSlice = createSlice({
  name: 'workers',
  initialState,
  reducers: {
    addWorker(state, action: PayloadAction<Worker>) {
      state.list?.push(action.payload);
    },
    removeWorker(state, action: PayloadAction<string>) {
      if (state.list) state.list = state.list.filter(w => !(w.source === 'project' && w.id === action.payload));
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchWorkers.pending, (state, action) => {
        if (state.projectId !== action.meta.arg) state.list = null;
        state.projectId = action.meta.arg;
        state.loading = true;
      })
      // An answer for a project no longer being seen is dropped.
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        if (action.meta.arg !== state.projectId) return;
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        if (action.meta.arg !== state.projectId) return;
        state.list = state.list ?? [];
        state.loading = false;
      });
  },
});

export const { addWorker, removeWorker } = workersSlice.actions;
export default workersSlice.reducer;
