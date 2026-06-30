import reducer, {
  setNotifications,
  addNotification,
  markRead,
  markAllRead,
  unmarkRead,
  unmarkAllRead,
  ServerNotification,
} from './notificationsSlice';

const makeNotif = (overrides: Partial<ServerNotification> = {}): ServerNotification => ({
  _id: 'n1',
  userId: 'u1',
  appId: null,
  type: 'info',
  message: 'Hello',
  data: null,
  callback: null,
  read: false,
  readAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const initialState = { items: [], loading: false };

describe('notificationsSlice', () => {
  describe('setNotifications', () => {
    it('replaces items', () => {
      const items = [makeNotif({ _id: 'n1' }), makeNotif({ _id: 'n2' })];
      const state = reducer(initialState, setNotifications(items));
      expect(state.items).toHaveLength(2);
      expect(state.items[0]._id).toBe('n1');
    });
  });

  describe('addNotification', () => {
    it('prepends a new notification', () => {
      const state = reducer(
        { items: [makeNotif({ _id: 'existing' })], loading: false },
        addNotification(makeNotif({ _id: 'new' })),
      );
      expect(state.items[0]._id).toBe('new');
      expect(state.items).toHaveLength(2);
    });

    it('ignores duplicates by _id', () => {
      const existing = makeNotif({ _id: 'same' });
      const state = reducer(
        { items: [existing], loading: false },
        addNotification(makeNotif({ _id: 'same', message: 'duplicate' })),
      );
      expect(state.items).toHaveLength(1);
      expect(state.items[0].message).toBe('Hello');
    });
  });

  describe('markRead', () => {
    it('marks a specific notification as read', () => {
      const state = reducer(
        { items: [makeNotif({ _id: 'n1', read: false })], loading: false },
        markRead({ id: 'n1', readAt: '2024-06-01T00:00:00Z' }),
      );
      expect(state.items[0].read).toBe(true);
      expect(state.items[0].readAt).toBe('2024-06-01T00:00:00Z');
    });

    it('does not affect other notifications', () => {
      const state = reducer(
        { items: [makeNotif({ _id: 'n1' }), makeNotif({ _id: 'n2' })], loading: false },
        markRead({ id: 'n1', readAt: '2024-06-01T00:00:00Z' }),
      );
      expect(state.items[1].read).toBe(false);
    });

    it('is a no-op for unknown id', () => {
      const initial = { items: [makeNotif({ _id: 'n1' })], loading: false };
      const state = reducer(initial, markRead({ id: 'unknown', readAt: '2024-06-01T00:00:00Z' }));
      expect(state.items[0].read).toBe(false);
    });
  });

  describe('markAllRead', () => {
    it('marks every notification as read', () => {
      const state = reducer(
        { items: [makeNotif({ _id: 'n1' }), makeNotif({ _id: 'n2' })], loading: false },
        markAllRead('2024-06-01T00:00:00Z'),
      );
      expect(state.items.every(n => n.read)).toBe(true);
      expect(state.items.every(n => n.readAt === '2024-06-01T00:00:00Z')).toBe(true);
    });
  });

  describe('unmarkRead', () => {
    it('restores previous read state', () => {
      const state = reducer(
        { items: [makeNotif({ _id: 'n1', read: true, readAt: '2024-06-01T00:00:00Z' })], loading: false },
        unmarkRead({ id: 'n1', wasRead: false, wasReadAt: null }),
      );
      expect(state.items[0].read).toBe(false);
      expect(state.items[0].readAt).toBeNull();
    });
  });

  describe('unmarkAllRead', () => {
    it('restores previous read states for all items in payload', () => {
      const items = [
        makeNotif({ _id: 'n1', read: true, readAt: '2024-06-01T00:00:00Z' }),
        makeNotif({ _id: 'n2', read: true, readAt: '2024-06-01T00:00:00Z' }),
      ];
      const state = reducer(
        { items, loading: false },
        unmarkAllRead([
          { id: 'n1', wasRead: false, wasReadAt: null },
          { id: 'n2', wasRead: true,  wasReadAt: '2024-01-01T00:00:00Z' },
        ]),
      );
      expect(state.items[0].read).toBe(false);
      expect(state.items[0].readAt).toBeNull();
      expect(state.items[1].read).toBe(true);
      expect(state.items[1].readAt).toBe('2024-01-01T00:00:00Z');
    });
  });
});
