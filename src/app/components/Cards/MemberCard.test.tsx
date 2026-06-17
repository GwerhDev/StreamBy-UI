import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberCard } from './MemberCard';
import { Member } from '../../../interfaces';

const member: Member = { userId: '1', username: 'alice', role: 'editor', status: 'active' };
const pendingMember: Member = { userId: '2', username: 'bob', role: 'viewer', status: 'pending' };

describe('MemberCard', () => {
  it('renders username', () => {
    render(<MemberCard member={member} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('shows "you" badge when isSelf', () => {
    render(<MemberCard member={member} isSelf />);
    expect(screen.getByText('you')).toBeInTheDocument();
  });

  it('shows "pending" badge for pending member', () => {
    render(<MemberCard member={pendingMember} />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('shows role badge for non-admin view', () => {
    render(<MemberCard member={member} />);
    expect(screen.getByText('editor')).toBeInTheDocument();
  });

  it('shows remove button for admin on non-self member', () => {
    render(<MemberCard member={member} isAdmin />);
    expect(screen.getByRole('button', { name: /remove member/i })).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<MemberCard member={member} isAdmin onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: /remove member/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not show remove button when isAdmin is false', () => {
    render(<MemberCard member={member} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
