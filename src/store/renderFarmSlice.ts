import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RenderFarmConnection } from '../interfaces';

interface RenderFarmState {
  connections: RenderFarmConnection[];
  loading: boolean;
  error: string | null;
}

const initialState: RenderFarmState = {
  connections: [],
  loading: false,
  error: null,
};

export const fetchRenderFarmConnections = createAsyncThunk(
  'renderFarm/fetchConnections',
  async (projectId: string) => {
    const { API_BASE } = await import('../config/api');
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/render-farm-connections`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch render farm connections');
    const data = await res.json();
    return data.connections as RenderFarmConnection[];
  },
);

const renderFarmSlice = createSlice({
  name: 'renderFarm',
  initialState,
  reducers: {
    addConnection(state, action: PayloadAction<RenderFarmConnection>) {
      state.connections.push(action.payload);
    },
    removeConnection(state, action: PayloadAction<string>) {
      state.connections = state.connections.filter(c => c.id !== action.payload);
    },
    updateConnection(state, action: PayloadAction<RenderFarmConnection>) {
      const idx = state.connections.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) state.connections[idx] = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchRenderFarmConnections.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchRenderFarmConnections.fulfilled, (state, action) => {
        state.loading = false;
        state.connections = action.payload;
      })
      .addCase(fetchRenderFarmConnections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export const { addConnection, removeConnection, updateConnection } = renderFarmSlice.actions;
export default renderFarmSlice.reducer;
