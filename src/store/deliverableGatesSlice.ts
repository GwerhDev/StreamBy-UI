import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { DeliverableNodeState } from '../interfaces';
import { getDeliverableGates } from '../services/deliverables';

// The state of the Deliverable nodes of the project being seen (as the workflow shows them), and
// how many times the websocket told that a gate changed: whatever shows a deliverable's state
// reads it again on each one.
interface DeliverableGatesState {
  projectId: string | null;
  // By node id; null until loaded.
  nodes: Record<string, DeliverableNodeState> | null;
  loading: boolean;
  eventSeq: number;
}

const initialState: DeliverableGatesState = { projectId: null, nodes: null, loading: false, eventSeq: 0 };

export const fetchDeliverableGates = createAsyncThunk(
  'deliverableGates/fetch',
  (projectId: string) => getDeliverableGates(projectId),
  {
    condition: (projectId, { getState }) => {
      const { deliverableGates } = getState() as { deliverableGates: DeliverableGatesState };
      return !(deliverableGates.loading && deliverableGates.projectId === projectId);
    },
  },
);

const deliverableGatesSlice = createSlice({
  name: 'deliverableGates',
  initialState,
  reducers: {
    deliverableGatesEventReceived(state) {
      state.eventSeq += 1;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDeliverableGates.pending, (state, action) => {
        if (state.projectId !== action.meta.arg) state.nodes = null;
        state.projectId = action.meta.arg;
        state.loading = true;
      })
      .addCase(fetchDeliverableGates.fulfilled, (state, action) => {
        if (action.meta.arg !== state.projectId) return;
        state.nodes = action.payload;
        state.loading = false;
      })
      .addCase(fetchDeliverableGates.rejected, (state, action) => {
        if (action.meta.arg !== state.projectId) return;
        state.nodes = state.nodes ?? {};
        state.loading = false;
      });
  },
});

export const { deliverableGatesEventReceived } = deliverableGatesSlice.actions;
export default deliverableGatesSlice.reducer;
