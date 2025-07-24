import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getDatabases } from '../services/streamby';
import { Database } from '../interfaces';

interface ManagementState {
  databases: Database[];
  loading: boolean;
  error: string | null;
}

const initialState: ManagementState = {
  databases: [],
  loading: false,
  error: null,
};

export const fetchDatabases = createAsyncThunk(
  'management/fetchDatabases',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDatabases();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const managementSlice = createSlice({
  name: 'management',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDatabases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDatabases.fulfilled, (state, action: PayloadAction<Database[]>) => {
        state.loading = false;
        state.databases = action.payload;
      })
      .addCase(fetchDatabases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default managementSlice.reducer;
