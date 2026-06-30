import { API_BASE } from '../config/api';
import { store } from '../store';
import { markRead, markAllRead, unmarkRead, unmarkAllRead } from '../store/notificationsSlice';

export async function markNotificationRead(id: string) {
  const prev = store.getState().notifications.items.find(n => n._id === id);
  const snapshot = prev ? { wasRead: prev.read, wasReadAt: prev.readAt } : null;

  store.dispatch(markRead({ id, readAt: new Date().toISOString() }));
  try {
    await fetch(`${API_BASE}/streamby/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include',
    });
  } catch {
    if (snapshot) store.dispatch(unmarkRead({ id, ...snapshot }));
  }
}

export async function markAllNotificationsRead() {
  const snapshot = store.getState().notifications.items.map(n => ({
    id: n._id,
    wasRead: n.read,
    wasReadAt: n.readAt,
  }));

  store.dispatch(markAllRead(new Date().toISOString()));
  try {
    await fetch(`${API_BASE}/streamby/notifications/read-all`, {
      method: 'PATCH',
      credentials: 'include',
    });
  } catch {
    store.dispatch(unmarkAllRead(snapshot));
  }
}
