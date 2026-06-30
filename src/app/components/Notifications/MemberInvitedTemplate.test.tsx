import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { MemberInvitedTemplate } from './MemberInvitedTemplate';
import { ServerNotification } from '../../../store/notificationsSlice';

vi.mock('../../../services/members', () => ({
  acceptInvitation: vi.fn().mockResolvedValue({}),
  rejectInvitation: vi.fn().mockResolvedValue({}),
}));

const makeStore = (userId = 'u1') =>
  configureStore({
    reducer: { session: () => ({ userId, username: 'user', logged: true }) },
  });

const makeNotif = (overrides: Partial<ServerNotification> = {}): ServerNotification => ({
  _id: 'n1',
  userId: 'u1',
  appId: null,
  type: 'member_invited',
  message: 'You have been invited to join Project X.',
  data: { projectId: 'p1', role: 'admin', invitedBy: 'owner' },
  callback: null,
  read: false,
  readAt: null,
  createdAt: '2024-06-01T10:00:00Z',
  ...overrides,
});

const renderTemplate = (notif = makeNotif()) =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter>
        <MemberInvitedTemplate notification={notif} />
      </MemoryRouter>
    </Provider>,
  );

describe('MemberInvitedTemplate', () => {
  it('renders the notification message', () => {
    renderTemplate();
    expect(screen.getByText('You have been invited to join Project X.')).toBeInTheDocument();
  });

  it('renders the role badge when provided', () => {
    renderTemplate();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('shows Accept and Reject buttons when not yet resolved', () => {
    renderTemplate();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('shows View project link when projectId is present', () => {
    renderTemplate();
    expect(screen.getByRole('button', { name: /view project/i })).toBeInTheDocument();
  });

  it('does not show View project button when projectId is absent', () => {
    renderTemplate(makeNotif({ data: null }));
    expect(screen.queryByRole('button', { name: /view project/i })).not.toBeInTheDocument();
  });

  it('does not render role badge when data is null', () => {
    renderTemplate(makeNotif({ data: null }));
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
  });
});
