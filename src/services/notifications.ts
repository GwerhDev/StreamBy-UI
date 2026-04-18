import { API_BASE } from '../config/api';
import { store } from '../store';
import { markRead, markAllRead } from '../store/notificationsSlice';

export async function markNotificationRead(id: string) {
  store.dispatch(markRead(id));
  try {
    await fetch(`${API_BASE}/streamby/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include',
    });
  } catch {
    // Optimistic update already applied
  }
}

export async function markAllNotificationsRead() {
  store.dispatch(markAllRead());
  try {
    await fetch(`${API_BASE}/streamby/notifications/read-all`, {
      method: 'PATCH',
      credentials: 'include',
    });
  } catch {
    // Optimistic update already applied
  }
}
