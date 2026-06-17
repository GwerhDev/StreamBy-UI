import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProjectButton } from './AddProjectButton';

describe('AddProjectButton', () => {
  it('renders button with title', () => {
    render(<AddProjectButton />);
    expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<AddProjectButton onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders without crashing when onClick is not provided', async () => {
    const user = userEvent.setup();
    render(<AddProjectButton />);
    await user.click(screen.getByRole('button'));
  });
});
