import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { API_BASE } from '../config/api';

export interface ServerNotification {
  _id: string;
  userId: string;
  appId: string | null;
  type: string;
  message: string;
  data: any | null;
  callback: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsState {
  items: ServerNotification[];
  loading: boolean;
}

const initialState: NotificationsState = {
  items: [],
  loading: false,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/streamby/notifications`, { credentials: 'include' });
      if (!res.ok) return rejectWithValue('Failed to fetch notifications');
      const { data } = await res.json();
      return data as ServerNotification[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<ServerNotification[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false; });
  },
  reducers: {
    setNotifications: (state, action: PayloadAction<ServerNotification[]>) => {
      state.items = action.payload;
    },
    addNotification: (state, action: PayloadAction<ServerNotification>) => {
      const exists = state.items.some(n => n._id === action.payload._id);
      if (!exists) state.items.unshift(action.payload);
    },
    markRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find(n => n._id === action.payload);
      if (item) {
        item.read = true;
        item.readAt = new Date().toISOString();
      }
    },
    markAllRead: (state) => {
      const now = new Date().toISOString();
      state.items.forEach(n => {
        n.read = true;
        n.readAt = now;
      });
    },
  },
});

export const { setNotifications, addNotification, markRead, markAllRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;

