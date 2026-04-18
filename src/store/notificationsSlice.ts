import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

const initialState: NotificationsState = {
  items: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
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
