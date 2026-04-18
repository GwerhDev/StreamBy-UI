import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { API_BASE } from '../config/api';
import { ServerNotification } from './notificationsSlice';

interface CurrentNotificationState {
  data: ServerNotification | null;
  loading: boolean;
  error: string | null;
}

const initialState: CurrentNotificationState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchNotificationById = createAsyncThunk(
  'currentNotification/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/streamby/notifications/${id}`, { credentials: 'include' });
      if (!res.ok) return rejectWithValue('Not found');
      const { data } = await res.json();
      return data as ServerNotification;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const currentNotificationSlice = createSlice({
  name: 'currentNotification',
  initialState,
  reducers: {
    clearCurrentNotification: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationById.fulfilled, (state, action: PayloadAction<ServerNotification>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchNotificationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentNotification } = currentNotificationSlice.actions;
export default currentNotificationSlice.reducer;
