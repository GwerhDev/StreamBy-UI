import { API_BASE } from '../config/api';
import { store } from '../store';
import { addNotification } from '../store/notificationsSlice';
import { addApiResponse } from '../store/apiResponsesSlice';
import { fetchNotifications } from './notifications';

const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

let socket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;
let shouldReconnect = false;

function clearReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

function scheduleReconnect() {
  clearReconnect();
  reconnectTimeout = setTimeout(() => {
    if (shouldReconnect) connectWS();
  }, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
}

function handleMessage(event: MessageEvent) {
  try {
    const msg = JSON.parse(event.data as string);
    if (msg.type === 'connected') {
      reconnectDelay = 1000;
      fetchNotifications();
    } else if (msg.type === 'notification') {
      store.dispatch(addNotification(msg.data));
      store.dispatch(addApiResponse({ message: msg.data.message, type: 'success' }));
    }
  } catch {
    // Ignore malformed messages
  }
}

export function connectWS() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
  ) return;

  shouldReconnect = true;
  socket = new WebSocket(WS_URL);

  socket.addEventListener('message', handleMessage);

  socket.addEventListener('close', (event) => {
    if (event.code === 1008) {
      // Unauthorized — server explicitly rejected, don't retry
      shouldReconnect = false;
      return;
    }
    if (shouldReconnect) scheduleReconnect();
  });

  socket.addEventListener('error', () => {
    // close event fires after error and handles reconnect
  });
}

export function disconnectWS() {
  shouldReconnect = false;
  clearReconnect();
  if (socket) {
    socket.close();
    socket = null;
  }
}
