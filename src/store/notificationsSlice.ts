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
    markRead: (state, action: PayloadAction<{ id: string; readAt: string }>) => {
      const item = state.items.find(n => n._id === action.payload.id);
      if (item) {
        item.read = true;
        item.readAt = action.payload.readAt;
      }
    },
    markAllRead: (state, action: PayloadAction<string>) => {
      state.items.forEach(n => {
        n.read = true;
        n.readAt = action.payload;
      });
    },
    unmarkRead: (state, action: PayloadAction<{ id: string; wasRead: boolean; wasReadAt: string | null }>) => {
      const item = state.items.find(n => n._id === action.payload.id);
      if (item) {
        item.read = action.payload.wasRead;
        item.readAt = action.payload.wasReadAt;
      }
    },
    unmarkAllRead: (state, action: PayloadAction<{ id: string; wasRead: boolean; wasReadAt: string | null }[]>) => {
      action.payload.forEach(({ id, wasRead, wasReadAt }) => {
        const item = state.items.find(n => n._id === id);
        if (item) {
          item.read = wasRead;
          item.readAt = wasReadAt;
        }
      });
    },
  },
});

export const { setNotifications, addNotification, markRead, markAllRead, unmarkRead, unmarkAllRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;

