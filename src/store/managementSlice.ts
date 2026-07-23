import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getUserIntegrations } from '../services/userIntegrations';
import { IntegrationPoolEntry } from '../interfaces';

interface ManagementState {
  integrations: IntegrationPoolEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: ManagementState = {
  integrations: [],
  loading: false,
  error: null,
};

export const fetchIntegrations = createAsyncThunk(
  'management/fetchIntegrations',
  async (_, { rejectWithValue }) => {
    try {
      return await getUserIntegrations();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const managementSlice = createSlice({
  name: 'management',
  initialState,
  reducers: {
    upsertIntegration: (state, action: PayloadAction<IntegrationPoolEntry>) => {
      const idx = state.integrations.findIndex(i => i.id === action.payload.id);
      if (idx === -1) state.integrations.push(action.payload);
      else state.integrations[idx] = action.payload;
    },
    removeIntegration: (state, action: PayloadAction<string>) => {
      state.integrations = state.integrations.filter(i => i.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntegrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIntegrations.fulfilled, (state, action: PayloadAction<IntegrationPoolEntry[]>) => {
        state.loading = false;
        state.integrations = action.payload;
      })
      .addCase(fetchIntegrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { upsertIntegration, removeIntegration } = managementSlice.actions;
export default managementSlice.reducer;
