import { API_BASE } from '../config/api';
import { store } from '../store';
import { setNotifications, markRead, markAllRead } from '../store/notificationsSlice';

export async function fetchNotifications() {
  try {
    const res = await fetch(`${API_BASE}/streamby/notifications`, { credentials: 'include' });
    if (!res.ok) return;
    const { data } = await res.json();
    store.dispatch(setNotifications(data));
  } catch {
    // Non-critical — silent fail
  }
}

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
